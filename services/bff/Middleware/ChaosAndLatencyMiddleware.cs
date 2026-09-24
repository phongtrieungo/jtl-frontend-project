using Bff.Services;

namespace Bff.Middleware;

/// <summary>
/// Middleware introducing realistic network latency (200-400ms)
/// and injecting simulated 500 failure responses when Chaos Mode is active.
/// </summary>
public class ChaosAndLatencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IChaosService _chaosService;
    private readonly ILogger<ChaosAndLatencyMiddleware> _logger;

    public ChaosAndLatencyMiddleware(
        RequestDelegate next,
        IChaosService chaosService,
        ILogger<ChaosAndLatencyMiddleware> logger)
    {
        _next = next;
        _chaosService = chaosService;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Simulate realistic network latency (200-400ms)
        // Allow opting out in integration tests via X-Skip-Latency header
        var skipLatency = context.Request.Headers.TryGetValue("X-Skip-Latency", out var skipVal)
                          && string.Equals(skipVal, "true", StringComparison.OrdinalIgnoreCase);

        if (!skipLatency)
        {
            var delayMs = Random.Shared.Next(200, 400);
            await Task.Delay(delayMs);
        }

        // 2. Check for Chaos trigger (Header or Global Toggle)
        var hasChaosHeader = context.Request.Headers.TryGetValue("X-Simulate-Chaos", out var headerValue)
                             && string.Equals(headerValue, "true", StringComparison.OrdinalIgnoreCase);

        var isChaosActive = hasChaosHeader || _chaosService.IsChaosActive;

        // 3. Inject simulated failure on mutations (POST, PUT, PATCH, DELETE)
        // Exclude chaos configuration endpoint so it can be turned off
        var isMutation = HttpMethods.IsPost(context.Request.Method) ||
                         HttpMethods.IsPut(context.Request.Method) ||
                         HttpMethods.IsPatch(context.Request.Method) ||
                         HttpMethods.IsDelete(context.Request.Method);

        var isChaosAdminEndpoint = context.Request.Path.StartsWithSegments("/api/chaos");

        if (isChaosActive && isMutation && !isChaosAdminEndpoint)
        {
            _logger.LogWarning("Chaos Mode intercepted {Method} {Path} — returning simulated 500 error",
                context.Request.Method, context.Request.Path);

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Simulated Network Failure",
                message = "The .NET BFF intercepted this request via Chaos Mode to test optimistic rollback.",
                timestamp = DateTime.UtcNow
            });
            return;
        }

        await _next(context);
    }
}
