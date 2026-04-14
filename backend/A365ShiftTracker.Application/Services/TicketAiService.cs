using System.Net.Http.Json;
using System.Text.Json;
using A365ShiftTracker.Application.DTOs;
using Microsoft.Extensions.Configuration;

namespace A365ShiftTracker.Application.Services;

public class TicketAiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public TicketAiService(IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _http = httpClientFactory.CreateClient("Claude");
        _apiKey = config["Claude:ApiKey"] ?? throw new InvalidOperationException("Claude:ApiKey not configured");
    }

    public async Task<AiGeneratedTicketDto> GenerateTicketAsync(string rawText)
    {
        var systemPrompt = """
            You are a CRM assistant. Given raw text (email, log entry, or note), extract a support/task ticket.

            Return ONLY valid JSON with these exact fields:
            {
              "title": "concise summary (max 80 chars)",
              "description": "cleaned body text",
              "type": "Client Support" | "Bug" | "Internal Task",
              "priority": "Critical" | "High" | "Medium" | "Low",
              "category": "Billing" | "Technical" | "Feature Request" | "HR" | "Legal" | "Other" | null,
              "suggestedContactName": "full name if mentioned, else null",
              "suggestedCompanyName": "company name if mentioned, else null",
              "confidence": 0.0 to 1.0
            }

            Priority rules:
            - Critical: words like "urgent", "ASAP", "system down", "data loss", "P0"
            - High: "important", "today", "by EOD", "blocking"
            - Low: "when possible", "nice to have", "future", "someday"
            - Medium: everything else
            """;

        var requestBody = new
        {
            model = "claude-sonnet-4-6",
            max_tokens = 512,
            system = systemPrompt,
            messages = new[]
            {
                new { role = "user", content = rawText }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", _apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = JsonContent.Create(requestBody);

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);

        var text = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        // Strip markdown code fences if present
        text = text.Trim();
        if (text.StartsWith("```")) text = text.Split('\n', 2)[1];
        if (text.EndsWith("```")) text = text[..text.LastIndexOf("```")];

        var result = JsonSerializer.Deserialize<AiGeneratedTicketDto>(text,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result ?? new AiGeneratedTicketDto
        {
            Title = "Untitled Ticket",
            Type = "Internal Task",
            Priority = "Medium",
            Confidence = 0.0m
        };
    }
}
