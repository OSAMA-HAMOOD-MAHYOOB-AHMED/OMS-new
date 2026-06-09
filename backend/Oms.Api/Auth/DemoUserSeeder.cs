using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Oms.Api.Models;

namespace Oms.Api.Auth;

public static class DemoUserSeeder
{
    public static async Task SeedAsync(WebApplication app, bool enabled)
    {
        if (!enabled) return;

        // Database may still be initializing on first boot; retry briefly.
        const int maxAttempts = 30;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var scope = app.Services.CreateScope();
                var users = scope.ServiceProvider.GetRequiredService<UserRepository>();

                // Demo credentials (change/disable in real deployments via DemoSeed:Enabled=false).
                const string demoPassword = "DemoPass!123";

                await EnsureUser(users, new UserRow
                {
                    Email = "admin@demo.local",
                    Name = "Demo Admin",
                    PhoneNumber = "+966500000001",
                    Address = "Riyadh, Saudi Arabia",
                    Role = UserRole.Admin,
                    Password = BCrypt.Net.BCrypt.HashPassword(demoPassword),
                    EmailVerified = true
                });

                await EnsureUser(users, new UserRow
                {
                    Email = "customer@demo.local",
                    Name = "Demo Customer",
                    PhoneNumber = "+966500000002",
                    Address = "Riyadh, Saudi Arabia",
                    Role = UserRole.Customer,
                    Password = BCrypt.Net.BCrypt.HashPassword(demoPassword),
                    EmailVerified = true
                });

                await EnsureUser(users, new UserRow
                {
                    Email = "sales@demo.local",
                    Name = "Demo Salesperson",
                    PhoneNumber = "+966500000003",
                    Address = "Riyadh, Saudi Arabia",
                    Role = UserRole.RetailSalesperson,
                    Password = BCrypt.Net.BCrypt.HashPassword(demoPassword),
                    EmailVerified = true
                });

                await EnsureUser(users, new UserRow
                {
                    Email = "warehouse@demo.local",
                    Name = "Demo Warehouse Manager",
                    PhoneNumber = "+966500000004",
                    Address = "Riyadh, Saudi Arabia",
                    Role = UserRole.WarehouseManager,
                    Password = BCrypt.Net.BCrypt.HashPassword(demoPassword),
                    EmailVerified = true
                });

                await users.MarkDemoUsersVerified();

                app.Logger.LogInformation("Demo users are present (seeded if missing).");
                return;
            }
            catch (Exception ex)
            {
                if (attempt >= maxAttempts)
                {
                    app.Logger.LogError(ex, "Demo seed failed after {Max} attempts.", maxAttempts);
                    throw;
                }

                app.Logger.LogWarning(ex, "Demo seed attempt {Attempt}/{Max} failed; retrying...", attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(1));
            }
        }
    }

    private static async Task EnsureUser(UserRepository users, UserRow desired)
    {
        var existing = await users.GetByEmail(desired.Email);
        if (existing is not null) return;

        // Create is idempotent enough for demo purposes (duplicate email returns false).
        var ok = await users.Create(desired);
        if (!ok)
        {
            // If another instance raced us, treat as success.
            var again = await users.GetByEmail(desired.Email);
            if (again is not null) return;
            throw new InvalidOperationException($"Failed to create demo user {desired.Email}.");
        }
    }
}
