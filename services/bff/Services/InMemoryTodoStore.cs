using System.Collections.Concurrent;
using Bff.Models;

namespace Bff.Services;

/// <summary>
/// Thread-safe in-memory Todo store seeded with demo tasks.
/// </summary>
public class InMemoryTodoStore : ITodoStore
{
    private readonly ConcurrentDictionary<string, TodoDto> _todos = new();

    public InMemoryTodoStore()
    {
        SeedDefaultTodos();
    }

    public void SeedDefaultTodos()
    {
        _todos.Clear();

        var initialTodos = new[]
        {
            new TodoDto(
                "todo-1",
                "Write algorithm for the Analytical Engine",
                "user-1",
                true,
                "2026-01-01T10:00:00.000Z"
            ),
            new TodoDto(
                "todo-2",
                "Draft notes on Bernoulli numbers computation",
                "user-1",
                false,
                "2026-01-01T11:00:00.000Z"
            ),
            new TodoDto(
                "todo-3",
                "Formalize Turing Machine computational model",
                "user-2",
                true,
                "2026-01-02T09:00:00.000Z"
            ),
            new TodoDto(
                "todo-4",
                "Crack Enigma Naval cipher specifications",
                "user-2",
                false,
                "2026-01-02T14:30:00.000Z"
            ),
            new TodoDto(
                "todo-5",
                "Author Apollo 11 guidance computer software",
                "user-3",
                true,
                "2026-01-03T08:00:00.000Z"
            ),
            new TodoDto(
                "todo-6",
                "Design asynchronous priority scheduling architecture",
                "user-3",
                false,
                "2026-01-03T16:00:00.000Z"
            )
        };

        foreach (var todo in initialTodos)
        {
            _todos[todo.Id] = todo;
        }
    }

    public Task<IReadOnlyList<TodoDto>> GetAllAsync(string? userId = null)
    {
        IEnumerable<TodoDto> query = _todos.Values;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(t => string.Equals(t.AssigneeId, userId, StringComparison.OrdinalIgnoreCase));
        }

        var sorted = query
            .OrderByDescending(t => DateTimeOffset.TryParse(t.CreatedAt, out var dt) ? dt : DateTimeOffset.MinValue)
            .ToList();

        return Task.FromResult<IReadOnlyList<TodoDto>>(sorted);
    }

    public Task<TodoDto?> GetByIdAsync(string id)
    {
        _todos.TryGetValue(id, out var todo);
        return Task.FromResult(todo);
    }

    public Task<TodoDto> CreateAsync(string title, string assigneeId)
    {
        var id = $"todo-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("n")[..4]}";
        var createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        var todo = new TodoDto(id, title.Trim(), assigneeId, false, createdAt);

        _todos[id] = todo;
        return Task.FromResult(todo);
    }

    public Task<TodoDto?> ToggleCompleteAsync(string id)
    {
        if (_todos.TryGetValue(id, out var existing))
        {
            var updated = existing with { Completed = !existing.Completed };
            _todos[id] = updated;
            return Task.FromResult<TodoDto?>(updated);
        }

        return Task.FromResult<TodoDto?>(null);
    }

    public Task<TodoDto?> UpdateAsync(string id, string? title, bool? completed, string? assigneeId)
    {
        if (_todos.TryGetValue(id, out var existing))
        {
            var updated = existing with
            {
                Title = !string.IsNullOrWhiteSpace(title) ? title.Trim() : existing.Title,
                Completed = completed ?? existing.Completed,
                AssigneeId = !string.IsNullOrWhiteSpace(assigneeId) ? assigneeId : existing.AssigneeId
            };
            _todos[id] = updated;
            return Task.FromResult<TodoDto?>(updated);
        }

        return Task.FromResult<TodoDto?>(null);
    }

    public Task<bool> DeleteAsync(string id)
    {
        var removed = _todos.TryRemove(id, out _);
        return Task.FromResult(removed);
    }

    public Task<int> GetCountByUserAsync(string userId)
    {
        var count = _todos.Values.Count(t => string.Equals(t.AssigneeId, userId, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(count);
    }

    public Task<Dictionary<string, int>> GetCountsGroupedByUserAsync()
    {
        var dict = _todos.Values
            .GroupBy(t => t.AssigneeId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        return Task.FromResult(dict);
    }

    public Task ResetAsync()
    {
        SeedDefaultTodos();
        return Task.CompletedTask;
    }
}
