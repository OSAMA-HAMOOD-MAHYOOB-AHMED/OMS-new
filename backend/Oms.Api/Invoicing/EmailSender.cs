using System.Net;
using System.Net.Mail;

namespace Oms.Api.Invoicing;

public interface IEmailSender
{
    Task Send(string to, string subject, string body);
}

public sealed class ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) : IEmailSender
{
    public Task Send(string to, string subject, string body)
    {
        logger.LogInformation("INVOICE EMAIL to={To} subject={Subject}\n{Body}", to, subject, body);
        return Task.CompletedTask;
    }
}

public sealed class SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly string? _host = config["Smtp:Host"];
    private readonly int _port = int.TryParse(config["Smtp:Port"], out var p) ? p : 25;
    private readonly string? _user = config["Smtp:Username"];
    private readonly string? _pass = config["Smtp:Password"];
    private readonly string _from = config["Smtp:From"] ?? "no-reply@oms.local";
    private readonly bool _enabled = string.Equals(config["Smtp:Enabled"], "true", StringComparison.OrdinalIgnoreCase);

    public async Task Send(string to, string subject, string body)
    {
        if (!_enabled || string.IsNullOrWhiteSpace(_host))
        {
            logger.LogInformation("SMTP disabled; skipping send to={To} subject={Subject}", to, subject);
            return;
        }

        using var client = new SmtpClient(_host, _port)
        {
            EnableSsl = false,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        if (!string.IsNullOrWhiteSpace(_user))
            client.Credentials = new NetworkCredential(_user, _pass);

        using var msg = new MailMessage(_from, to, subject, body);
        await client.SendMailAsync(msg);
    }
}

