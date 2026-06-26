using System.Text;
using System.Text.Json;

namespace Oms.Api.Invoicing;

public sealed class BrevoEmailSender(IConfiguration config, ILogger<BrevoEmailSender> logger, IHttpClientFactory http) : IEmailSender
{
    private readonly string? _apiKey = config["Brevo:ApiKey"];
    private readonly string _from = config["Smtp:From"] ?? "no-reply@oms.local";

    public async Task Send(string to, string subject, string body, string? htmlBody = null)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            logger.LogWarning("Brevo API key not configured; email NOT sent to {To}. Subject: {Subject}", to, subject);
            return;
        }

        var payload = new
        {
            sender = new { name = "Al-Wakeel Al-Shamel", email = _from },
            to = new[] { new { email = to } },
            subject,
            htmlContent = htmlBody ?? body,
            textContent = body
        };

        await PostAsync(payload, to, subject);
    }

    public async Task SendWithAttachment(string to, string subject, string body, string attachmentFileName, byte[] attachmentBytes, string contentType)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            logger.LogWarning("Brevo API key not configured; email with attachment NOT sent to {To}. Subject: {Subject}", to, subject);
            return;
        }

        var payload = new
        {
            sender = new { name = "Al-Wakeel Al-Shamel", email = _from },
            to = new[] { new { email = to } },
            subject,
            textContent = body,
            attachment = new[]
            {
                new { content = Convert.ToBase64String(attachmentBytes), name = attachmentFileName }
            }
        };

        await PostAsync(payload, to, subject);
    }

    private async Task PostAsync(object payload, string to, string subject)
    {
        try
        {
            var client = http.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                logger.LogInformation("Email sent to {To} via Brevo API. Subject: {Subject}", to, subject);
                return;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            logger.LogError("Brevo API returned {Status} for {To}. Response: {Body}", (int)response.StatusCode, to, responseBody);
            throw new InvalidOperationException($"Brevo API error {(int)response.StatusCode}: {responseBody}");
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            logger.LogError(ex, "Failed to send email to {To} via Brevo API. Subject: {Subject}", to, subject);
            throw;
        }
    }
}
