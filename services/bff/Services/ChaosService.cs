namespace Bff.Services;

/// <summary>
/// Thread-safe in-memory chaos service implementation.
/// </summary>
public class ChaosService : IChaosService
{
    private volatile bool _isChaosActive;

    public bool IsChaosActive => _isChaosActive;

    public void SetChaos(bool active)
    {
        _isChaosActive = active;
    }

    public bool ToggleChaos()
    {
        _isChaosActive = !_isChaosActive;
        return _isChaosActive;
    }
}
