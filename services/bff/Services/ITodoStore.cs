using Bff.Models;

namespace Bff.Services;

/// <summary>
/// Contract for Todo data access operations.
/// </summary>
public interface ITodoStore
{
    Task<IReadOnlyList<TodoDto>> GetAllAsync(string? userId = null);
    Task<TodoDto?> GetByIdAsync(string id);
    Task<TodoDto> CreateAsync(string title, string assigneeId);
    Task<TodoDto?> ToggleCompleteAsync(string id);
    Task<TodoDto?> UpdateAsync(string id, string? title, bool? completed, string? assigneeId);
    Task<bool> DeleteAsync(string id);
    Task<int> GetCountByUserAsync(string userId);
    Task<Dictionary<string, int>> GetCountsGroupedByUserAsync();
    Task ResetAsync();
}
