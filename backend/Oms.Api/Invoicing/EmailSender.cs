using System.Net;
using System.Net.Mail;

namespace Oms.Api.Invoicing;

public interface IEmailSender
{
    Task Send(string to, string subject, string body, string? htmlBody = null);
    Task SendWithAttachment(string to, string subject, string body, string attachmentFileName, byte[] attachmentBytes, string contentType);
}

public sealed class ConsoleEmailSender(ILogger<ConsoleEmailSender> logger) : IEmailSender
{
    public Task Send(string to, string subject, string body, string? htmlBody = null)
    {
        logger.LogWarning(
            "SMTP is disabled — email was NOT sent to {To}. Enable Smtp:Enabled in config, or use Mailpit at http://localhost:8025. Subject: {Subject}\n{Body}",
            to,
            subject,
            body);
        return Task.CompletedTask;
    }

    public Task SendWithAttachment(string to, string subject, string body, string attachmentFileName, byte[] attachmentBytes, string contentType)
    {
        logger.LogWarning(
            "SMTP is disabled — email with attachment was NOT sent to {To}. Subject: {Subject}. Attachment: {Attachment} ({Bytes} bytes)\n{Body}",
            to,
            subject,
            attachmentFileName,
            attachmentBytes.Length,
            body);
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
    private readonly bool _enableSsl = string.Equals(config["Smtp:EnableSsl"], "true", StringComparison.OrdinalIgnoreCase);

    public async Task Send(string to, string subject, string body, string? htmlBody = null)
    {
        if (!_enabled || string.IsNullOrWhiteSpace(_host))
        {
            logger.LogWarning("SMTP disabled; email NOT sent to {To}. Subject: {Subject}", to, subject);
            return;
        }

        try
        {
            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl = _enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            if (!string.IsNullOrWhiteSpace(_user))
                client.Credentials = new NetworkCredential(_user, _pass);

            using var msg = new MailMessage { From = new MailAddress(_from), Subject = subject };
            msg.To.Add(to);

            if (!string.IsNullOrWhiteSpace(htmlBody))
            {
                msg.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html"));
                msg.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(body, null, "text/plain"));
            }
            else
            {
                msg.Body = body;
                msg.IsBodyHtml = false;
            }

            await client.SendMailAsync(msg);
            logger.LogInformation("Email sent to {To}. Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}. Subject: {Subject}", to, subject);
            throw;
        }
    }

    public async Task SendWithAttachment(string to, string subject, string body, string attachmentFileName, byte[] attachmentBytes, string contentType)
    {
        if (!_enabled || string.IsNullOrWhiteSpace(_host))
        {
            logger.LogWarning("SMTP disabled; email with attachment NOT sent to {To}. Subject: {Subject}", to, subject);
            return;
        }

        try
        {
            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl = _enableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            if (!string.IsNullOrWhiteSpace(_user))
                client.Credentials = new NetworkCredential(_user, _pass);

            using var msg = new MailMessage(_from, to, subject, body) { IsBodyHtml = false };
            using var stream = new MemoryStream(attachmentBytes);
            msg.Attachments.Add(new Attachment(stream, attachmentFileName, contentType));
            await client.SendMailAsync(msg);
            logger.LogInformation("Email with attachment sent to {To}. Subject: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email with attachment to {To}. Subject: {Subject}", to, subject);
            throw;
        }
    }
}

