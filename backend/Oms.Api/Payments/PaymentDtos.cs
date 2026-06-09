namespace Oms.Api.Payments;

public sealed record CreditCardPaymentDetails(
    string CardNumber,
    string Expiry,
    string Cvv,
    string CardholderName
);

public sealed record OnlineBankingPaymentDetails(
    string BankName,
    string AccountNumber
);

public sealed record PaymentDetails(
    CreditCardPaymentDetails? CreditCard,
    OnlineBankingPaymentDetails? OnlineBanking
);

public sealed record PaymentResult(bool Success, string? TransactionId, string? ErrorMessage);
