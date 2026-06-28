using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace Oms.Api.Chat;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public sealed class ChatController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _cfg;

    public ChatController(IHttpClientFactory http, IConfiguration cfg)
    {
        _http = http;
        _cfg = cfg;
    }

    [HttpPost]
    public async Task<IActionResult> Chat([FromBody] ChatRequest req, CancellationToken ct)
    {
        var apiKey = _cfg["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(503, new { error = "Chat is not configured." });

        var messages = new List<object>();
        foreach (var m in req.History.TakeLast(10))
            messages.Add(new { role = m.Role, content = m.Content });
        messages.Add(new { role = "user", content = req.Message });

        var body = new
        {
            model = "claude-haiku-4-5-20251001",
            max_tokens = 512,
            system = """
                You are a helpful shopping assistant for Al-Wakeel Al-Shamel, a phone accessories store.
                The store sells phone chargers, earphones, power banks, and phone cases.
                Help customers with product questions, pricing guidance, order inquiries, and general shopping help.
                Keep responses concise and friendly.
                If asked about something unrelated to the store or phone accessories, politely redirect back to shopping.
                """,
            messages
        };

        using var client = _http.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            return StatusCode(502, new { error = "AI service error." });

        using var doc = JsonDocument.Parse(json);
        var reply = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "Sorry, I couldn't generate a response.";

        return Ok(new ChatResponse(reply));
    }
}
