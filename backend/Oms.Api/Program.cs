using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Oms.Api.Auth;
using Oms.Api.Data;
using Oms.Api.Invoicing;
using Oms.Api.Payments;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

QuestPDF.Settings.License = LicenseType.Community;

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.Configure<Oms.Api.Auth.JwtOptions>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true);
    });
});

builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddSingleton<Oms.Api.Auth.UserRepository>();
builder.Services.AddSingleton<Oms.Api.Auth.TokenService>();
builder.Services.AddSingleton<Oms.Api.Catalog.ProductRepository>();
builder.Services.AddSingleton<Oms.Api.Orders.OrderRepository>();
builder.Services.AddSingleton<Oms.Api.Inventory.InventoryRepository>();
builder.Services.AddSingleton<Oms.Api.Dashboards.DashboardRepository>();
builder.Services.AddSingleton<Oms.Api.Users.UserProfileRepository>();
builder.Services.AddSingleton<Oms.Api.Admin.AdminRepository>();
builder.Services.AddSingleton<InvoiceRepository>();
builder.Services.AddSingleton<InvoicePdfGenerator>();
builder.Services.AddSingleton<InvoiceService>();
builder.Services.AddSingleton<NotificationService>();
builder.Services.AddSingleton<PaymentService>();
builder.Services.AddSingleton<EmailVerificationService>();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<BrevoEmailSender>();
builder.Services.AddSingleton<ConsoleEmailSender>();
builder.Services.AddSingleton<SmtpEmailSender>();
builder.Services.AddSingleton<IEmailSender>(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    if (!string.IsNullOrWhiteSpace(cfg["Brevo:ApiKey"]))
        return sp.GetRequiredService<BrevoEmailSender>();
    return string.Equals(cfg["Smtp:Enabled"], "true", StringComparison.OrdinalIgnoreCase)
        ? sp.GetRequiredService<SmtpEmailSender>()
        : sp.GetRequiredService<ConsoleEmailSender>();
});

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()
                 ?? throw new InvalidOperationException("Missing Jwt configuration.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

var demoSeedEnabled = builder.Configuration.GetValue("DemoSeed:Enabled", true);
await DemoUserSeeder.SeedAsync(app, demoSeedEnabled);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection();
}

app.UseCors("frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

