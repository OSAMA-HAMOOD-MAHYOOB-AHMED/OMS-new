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
    private const string SystemPrompt = """
        You are a helpful support assistant for Al-Wakeel Al-Shamel, a phone accessories Order Management System (OMS).

        === ABOUT THE SYSTEM ===
        Al-Wakeel Al-Shamel is an online store and order management platform that sells:
        - Phone Chargers
        - Earphones
        - Power Banks
        - Phone Cases

        === USER ROLES & FEATURES ===

        CUSTOMER:
        - Browse and search products (filter by category, price range, stock availability, sort options)
        - Add products to cart and place orders
        - View order history at: My Orders page
        - Manage account profile at: Profile page
        - Track order status (Pending, Processing, Shipped, Delivered, Cancelled)

        RETAIL SALESPERSON:
        - Create and manage sales orders from the Sales Dashboard
        - View and process customer orders at the Orders page
        - Cannot browse the public product catalog directly

        WAREHOUSE MANAGER:
        - Browse and manage product inventory at the Products page
        - Update stock levels at the Inventory page
        - View warehouse stats on the Warehouse Dashboard

        ADMIN:
        - Full access to Admin Panel
        - Manage all products (add, edit, delete, pricing)
        - View and manage all orders across all users
        - Manage customer accounts
        - View sales and inventory reports

        === HOW TO USE - COMMON TASKS ===

        How to place an order (Customer):
        1. Log in to your account
        2. Go to Products and browse or filter items
        3. Click a product and add it to your cart
        4. Go to Cart and review your items
        5. Click "Place Order" to confirm

        How to track an order (Customer):
        1. Log in and go to "My Orders" from the navigation
        2. You will see all your orders with their current status

        How to register:
        1. Click "Sign Up" or "Create Account" on the home page
        2. Fill in your name, email, and password
        3. Submit — you will be logged in as a Customer

        How to log in:
        1. Click "Login" on the top navigation bar
        2. Enter your email and password

        How to reset password:
        - Contact the store admin to reset your password

        === RULES ===
        - Only answer questions related to Al-Wakeel Al-Shamel OMS and its features
        - If asked about something unrelated, politely say you can only help with the OMS system
        - Keep answers concise, friendly, and in the same language the user writes in
        - If you don't know something specific (like a product price), advise the user to check the Products page or contact the admin
        """;

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
        var apiKey = _cfg["Groq:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return StatusCode(503, new { error = "Chat is not configured." });

        var messages = new List<object> { new { role = "system", content = SystemPrompt } };
        foreach (var m in req.History.TakeLast(10))
            messages.Add(new { role = m.Role, content = m.Content });
        messages.Add(new { role = "user", content = req.Message });

        var body = new
        {
            model = "llama-3.1-8b-instant",
            messages,
            max_tokens = 512
        };

        using var client = _http.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            return StatusCode(502, new { error = $"Groq error {(int)response.StatusCode}: {json}" });

        using var doc = JsonDocument.Parse(json);
        var reply = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "Sorry, I couldn't generate a response.";

        return Ok(new ChatResponse(reply));
    }
}
