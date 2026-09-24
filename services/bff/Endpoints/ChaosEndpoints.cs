using Bff.Models;
using Bff.Services;

namespace Bff.Endpoints;

/// <summary>
/// Route mappings for Chaos simulation control (/api/chaos).
/// </summary>
public static class ChaosEndpoints
{
    public static RouteGroupBuilder MapChaosEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", (IChaosService chaosService) =>
        {
            return Results.Ok(new
            {
                chaosActive = chaosService.IsChaosActive,
                description = "When active, mutating operations (/api/todos POST/PUT/DELETE) return simulated 500 errors."
            });
        })
        .WithName("GetChaosStatus")
        .WithSummary("Retrieves the current chaos mode status");

        group.MapPost("/toggle", (IChaosService chaosService) =>
        {
            var newState = chaosService.ToggleChaos();
            return Results.Ok(new
            {
                chaosActive = newState,
                message = newState ? "Chaos mode activated." : "Chaos mode deactivated."
            });
        })
        .WithName("ToggleChaos")
        .WithSummary("Toggles global chaos simulation mode");

        group.MapPost("/", (SetChaosRequest request, IChaosService chaosService) =>
        {
            var enabled = request?.Enabled ?? false;
            chaosService.SetChaos(enabled);
            return Results.Ok(new
            {
                chaosActive = enabled,
                message = enabled ? "Chaos mode activated." : "Chaos mode deactivated."
            });
        })
        .WithName("SetChaosStatus")
        .WithSummary("Sets global chaos simulation mode");

        return group;
    }
}
