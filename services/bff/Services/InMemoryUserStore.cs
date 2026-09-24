using System.Collections.Concurrent;
using Bff.Models;

namespace Bff.Services;

/// <summary>
/// Thread-safe in-memory User store seeded with demo users.
/// </summary>
public class InMemoryUserStore : IUserStore
{
    private readonly ConcurrentDictionary<string, UserDto> _users = new();
    private readonly ITodoStore _todoStore;

    public InMemoryUserStore(ITodoStore todoStore)
    {
        _todoStore = todoStore;
        SeedDefaultUsers();
    }

    public void SeedDefaultUsers()
    {
        _users.Clear();

        var initialUsers = new[]
        {
            new UserDto("user-1", "Ada Lovelace", "2026-01-01T00:00:00.000Z"),
            new UserDto("user-2", "Alan Turing", "2026-01-02T00:00:00.000Z"),
            new UserDto("user-3", "Margaret Hamilton", "2026-01-03T00:00:00.000Z")
        };

        foreach (var user in initialUsers)
        {
            _users[user.Id] = user;
        }
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync()
    {
        var counts = await _todoStore.GetCountsGroupedByUserAsync();

        var list = _users.Values
            .OrderBy(u => DateTimeOffset.TryParse(u.CreatedAt, out var dt) ? dt : DateTimeOffset.MinValue)
            .Select(u => u with { TaskCount = counts.GetValueOrDefault(u.Id, 0) })
            .ToList();

        return list;
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        if (_users.TryGetValue(id, out var user))
        {
            var taskCount = await _todoStore.GetCountByUserAsync(id);
            return user with { TaskCount = taskCount };
        }

        return null;
    }

    public Task<UserDto> CreateAsync(string username)
    {
        var id = $"user-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("n")[..4]}";
        var createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        var user = new UserDto(id, username.Trim(), createdAt, TaskCount: 0);

        _users[id] = user;
        return Task.FromResult(user);
    }

    public Task<bool> ExistsAsync(string id)
    {
        return Task.FromResult(_users.ContainsKey(id));
    }

    public Task ResetAsync()
    {
        SeedDefaultUsers();
        return Task.CompletedTask;
    }
}
