using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Oms.Api.Auth;
using Oms.Api.Data;
using Oms.Api.Invoicing;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddSingleton<InvoiceRepository>();
builder.Services.AddSingleton<InvoiceService>();
builder.Services.AddSingleton<ConsoleEmailSender>();
builder.Services.AddSingleton<SmtpEmailSender>();
builder.Services.AddSingleton<IEmailSender>(sp =>
{
    // Prefer SMTP if enabled, otherwise log invoice to console.
    var cfg = sp.GetRequiredService<IConfiguration>();
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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

