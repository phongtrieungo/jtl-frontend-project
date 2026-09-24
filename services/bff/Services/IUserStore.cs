using Bff.Models;

namespace Bff.Services;

/// <summary>
/// Contract for User data access operations.
/// </summary>
public interface IUserStore
{
    Task<IReadOnlyList<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(string id);
    Task<UserDto> CreateAsync(string username);
    Task<bool> ExistsAsync(string id);
    Task ResetAsync();
}
