namespace Bff.Services;

/// <summary>
/// Service coordinating simulated chaos state across the BFF.
/// </summary>
public interface IChaosService
{
    bool IsChaosActive { get; }
    void SetChaos(bool active);
    bool ToggleChaos();
}
