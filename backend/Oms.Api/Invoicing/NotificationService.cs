namespace Oms.Api.Invoicing;

public sealed class NotificationService(IEmailSender emailSender, IConfiguration config, ILogger<NotificationService> logger)
{
    private string FrontendUrl => config["App:FrontendUrl"] ?? "http://localhost:5173";

    public Task SendSignupVerificationAsync(string email, string name, string token)
    {
        var link = $"{FrontendUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(token)}";
        var subject = "Verify your Al-Wakeel Al-Shamel account";
        var plainBody = $"""
            Hello {name},

            Thank you for signing up with Al-Wakeel Al-Shamel.

            Please verify your email address by opening this link:
            {link}

            This link expires in 24 hours.

            If you did not create an account, you can ignore this email.

            — Al-Wakeel Al-Shamel OMS
            """;

        var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:24px 12px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                      <tr>
                        <td style="background:#2563eb;padding:24px 28px;">
                          <div style="font-size:22px;font-weight:800;color:#ffffff;">Al-Wakeel Al-Shamel</div>
                          <div style="font-size:13px;color:#dbeafe;margin-top:4px;">Verify your email address</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:28px;">
                          <p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Hello <strong>{System.Net.WebUtility.HtmlEncode(name)}</strong>,</p>
                          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">
                            Thanks for creating an account. To complete registration and start shopping, please confirm that
                            <strong>{System.Net.WebUtility.HtmlEncode(email)}</strong> belongs to you.
                          </p>
                          <p style="margin:0 0 24px;text-align:center;">
                            <a href="{link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:800;font-size:15px;">
                              Verify email address
                            </a>
                          </p>
                          <p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#64748b;">
                            This link expires in <strong>24 hours</strong>. If the button does not work, copy and paste this URL into your browser:
                          </p>
                          <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;color:#2563eb;">{link}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                          If you did not create this account, you can safely ignore this email.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

        return emailSender.Send(email, subject, plainBody, htmlBody);
    }

    public Task SendOrderConfirmationWithInvoiceAsync(
        string email,
        string name,
        string orderID,
        decimal total,
        string paymentMethod,
        string? transactionId,
        string invoiceBody,
        byte[] invoicePdf)
    {
        var methodLabel = paymentMethod switch
        {
            "CreditCard" => "Credit Card",
            "OnlineBanking" => "Online Banking",
            _ => paymentMethod
        };

        var invoiceUrl = $"{FrontendUrl.TrimEnd('/')}/checkout/invoice/{Uri.EscapeDataString(orderID)}";
        var subject = $"Order confirmed — {orderID}";
        var body = $"""
            Hello {name},

            Thank you for your order! Your payment has been received and verified successfully.

            Order ID:    {orderID}
            Amount:      ${total:F2}
            Method:      {methodLabel}
            Transaction: {transactionId ?? "—"}
            Status:      Paid

            Your PDF invoice is attached to this email.
            You can also view or download it online:
            {invoiceUrl}

            Your order is now being processed. We will notify you when it ships.

            — Al-Wakeel Al-Shamel OMS
            """;
        logger.LogInformation("Sending order confirmation with PDF invoice to {Email} for order {OrderID}", email, orderID);
        return emailSender.SendWithAttachment(
            email,
            subject,
            body,
            $"invoice-{orderID}.pdf",
            invoicePdf,
            "application/pdf");
    }
}
