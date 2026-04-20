using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EvergreenNotes.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EvergreenNotes.Application.Services
{
    public class DeepSeekReviewQuestionGenerator : IReviewQuestionGenerator
    {
        private const string DefaultBaseUrl = "https://api.deepseek.com";
        private const string DefaultModel = "deepseek-chat";
        private const int DefaultMaxChars = 1500;

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DeepSeekReviewQuestionGenerator> _logger;

        public DeepSeekReviewQuestionGenerator(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<DeepSeekReviewQuestionGenerator> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GenerateQuestionAsync(string title, string content, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(title))
            {
                return "What is one key idea from this note that you can explain in your own words?";
            }

            var apiKey = _configuration["DeepSeek:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return BuildFallbackQuestion(title);
            }

            var baseUrl = _configuration["DeepSeek:BaseUrl"] ?? DefaultBaseUrl;
            var model = _configuration["DeepSeek:Model"] ?? DefaultModel;
            var maxChars = ParseMaxChars(_configuration["DeepSeek:QuestionMaxContentChars"]);

            var promptContent = Truncate(content, maxChars);

            var requestBody = new
            {
                model,
                temperature = 0.4,
                max_tokens = 120,
                messages = new object[]
                {
                    new
                    {
                        role = "system",
                        content = "You generate one concise reflection question for a personal knowledge note. Return only the question text, no explanation."
                    },
                    new
                    {
                        role = "user",
                        content = $"Title: {title}\n\nContent:\n{promptContent}\n\nGenerate one thoughtful question that helps the user deepen or apply this note."
                    }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl.TrimEnd('/')}/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            try
            {
                using var response = await _httpClient.SendAsync(request, cancellationToken);
                var payload = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("DeepSeek question generation failed with status {StatusCode}: {Payload}", response.StatusCode, payload);
                    return BuildFallbackQuestion(title);
                }

                var question = ExtractQuestion(payload);
                return string.IsNullOrWhiteSpace(question) ? BuildFallbackQuestion(title) : question;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DeepSeek question generation threw an exception.");
                return BuildFallbackQuestion(title);
            }
        }

        private static int ParseMaxChars(string? raw)
        {
            return int.TryParse(raw, out var parsed) && parsed > 200 ? parsed : DefaultMaxChars;
        }

        private static string Truncate(string value, int maxChars)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxChars)
            {
                return value;
            }

            return value[..maxChars];
        }

        private static string ExtractQuestion(string json)
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            if (!root.TryGetProperty("choices", out var choices) || choices.ValueKind != JsonValueKind.Array || choices.GetArrayLength() == 0)
            {
                return string.Empty;
            }

            var message = choices[0].GetProperty("message");
            if (!message.TryGetProperty("content", out var contentElement))
            {
                return string.Empty;
            }

            var content = contentElement.GetString()?.Trim() ?? string.Empty;
            if (content.Length == 0)
            {
                return string.Empty;
            }

            // Keep only the first line to avoid multi-paragraph responses.
            var firstLine = content.Split('\n', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
            return string.IsNullOrWhiteSpace(firstLine) ? content : firstLine;
        }

        private static string BuildFallbackQuestion(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return "What is one idea from this note you can connect to something you already know?";
            }

            return $"How would you explain \"{title}\" to someone encountering it for the first time?";
        }
    }
}
