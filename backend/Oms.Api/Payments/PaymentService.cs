using System.Text.RegularExpressions;

namespace Oms.Api.Payments;

public sealed class PaymentService
{
    private static readonly Regex CardDigits = new(@"^\d{13,19}$", RegexOptions.Compiled);
    private static readonly Regex Expiry = new(@"^(0[1-9]|1[0-2])\/\d{2}$", RegexOptions.Compiled);
    private static readonly Regex Cvv = new(@"^\d{3,4}$", RegexOptions.Compiled);
    private static readonly Regex AccountNumber = new(@"^\d{8,20}$", RegexOptions.Compiled);

    public async Task<PaymentResult> ProcessAsync(string paymentMethod, PaymentDetails details, decimal amount)
    {
        await Task.Delay(300);

        if (amount <= 0)
            return new PaymentResult(false, null, "Invalid payment amount.");

        if (string.Equals(paymentMethod, "CreditCard", StringComparison.OrdinalIgnoreCase))
            return ProcessCreditCard(details.CreditCard);

        if (string.Equals(paymentMethod, "OnlineBanking", StringComparison.OrdinalIgnoreCase))
            return ProcessOnlineBanking(details.OnlineBanking);

        return new PaymentResult(false, null, "Unsupported payment method.");
    }

    private static PaymentResult ProcessCreditCard(CreditCardPaymentDetails? card)
    {
        if (card is null)
            return new PaymentResult(false, null, "Credit card details are required.");

        var number = card.CardNumber.Replace(" ", "").Replace("-", "");
        if (!CardDigits.IsMatch(number))
            return new PaymentResult(false, null, "Invalid card number.");

        if (!Expiry.IsMatch(card.Expiry.Trim()))
            return new PaymentResult(false, null, "Expiry must be MM/YY.");

        if (!Cvv.IsMatch(card.Cvv.Trim()))
            return new PaymentResult(false, null, "Invalid CVV.");

        if (string.IsNullOrWhiteSpace(card.CardholderName))
            return new PaymentResult(false, null, "Cardholder name is required.");

        if (number == "4000000000000002")
            return new PaymentResult(false, null, "Payment declined by the card issuer.");

        var txn = $"CC-{Guid.NewGuid():N}"[..20].ToUpperInvariant();
        return new PaymentResult(true, txn, null);
    }

    private static PaymentResult ProcessOnlineBanking(OnlineBankingPaymentDetails? banking)
    {
        if (banking is null)
            return new PaymentResult(false, null, "Online banking details are required.");

        if (string.IsNullOrWhiteSpace(banking.BankName))
            return new PaymentResult(false, null, "Bank name is required.");

        var account = banking.AccountNumber.Replace(" ", "").Replace("-", "");
        if (!AccountNumber.IsMatch(account))
            return new PaymentResult(false, null, "Account number must be 8–20 digits.");

        if (account == "00000000000000")
            return new PaymentResult(false, null, "Payment declined by the bank.");

        var txn = $"OB-{Guid.NewGuid():N}"[..20].ToUpperInvariant();
        return new PaymentResult(true, txn, null);
    }
}
