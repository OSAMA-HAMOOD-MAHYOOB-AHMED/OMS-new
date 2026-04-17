namespace Oms.Api.Orders;

public sealed record UpdateOrderStatusRequest(string OrderID, string OrderStatus);

public sealed record CreditDecisionRequest(string OrderID, bool Approve);

