namespace Oms.Api.Chat;

public sealed record ChatMessage(string Role, string Content);
public sealed record ChatRequest(string Message, IReadOnlyList<ChatMessage> History);
public sealed record ChatResponse(string Reply);
