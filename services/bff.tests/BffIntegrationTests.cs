using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Bff.Tests;

/// <summary>
/// Integration tests for User endpoints (/api/users).
/// Uses WebApplicationFactory to run the real ASP.NET Core pipeline in-memory.
/// Requests carry X-Skip-Latency: true to avoid the 200-400ms artificial delay.
/// </summary>
public class UserEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public UserEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("X-Skip-Latency", "true");
    }

    [Fact]
    public async Task GetUsers_ReturnsOk_WithSeedData()
    {
        var response = await _client.GetAsync("/api/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var users = await response.Content.ReadFromJsonAsync<List<UserDto>>();
        Assert.NotNull(users);
        Assert.Equal(3, users.Count);
    }

    [Fact]
    public async Task GetUsers_IncludesTaskCounts()
    {
        var response = await _client.GetAsync("/api/users");
        var users = await response.Content.ReadFromJsonAsync<List<UserDto>>();

        Assert.NotNull(users);
        Assert.All(users, u => Assert.True(u.TaskCount >= 0));
    }

    [Fact]
    public async Task GetUserById_ExistingUser_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/users/user-1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
        Assert.Equal("user-1", user.Id);
        Assert.Equal("Ada Lovelace", user.Username);
    }

    [Fact]
    public async Task GetUserById_NonExistentUser_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/users/user-does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateUser_ValidUsername_ReturnsCreated()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { username = "Grace Hopper" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
        Assert.Equal("Grace Hopper", user.Username);
        Assert.NotEmpty(user.Id);
    }

    [Fact]
    public async Task CreateUser_ShortUsername_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { username = "AB" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateUser_EmptyUsername_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/users", new { username = "" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}

/// <summary>
/// Integration tests for Todo endpoints (/api/todos).
/// </summary>
public class TodoEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public TodoEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("X-Skip-Latency", "true");
    }

    [Fact]
    public async Task GetTodos_ReturnsOk_WithSeedData()
    {
        var response = await _client.GetAsync("/api/todos");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var todos = await response.Content.ReadFromJsonAsync<List<TodoDto>>();
        Assert.NotNull(todos);
        Assert.Equal(6, todos.Count);
    }

    [Fact]
    public async Task GetTodos_FilteredByUserId_ReturnsSubset()
    {
        var response = await _client.GetAsync("/api/todos?userId=user-1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var todos = await response.Content.ReadFromJsonAsync<List<TodoDto>>();
        Assert.NotNull(todos);
        Assert.Equal(2, todos.Count);
        Assert.All(todos, t => Assert.Equal("user-1", t.AssigneeId));
    }

    [Fact]
    public async Task GetTodoById_ExistingTodo_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/todos/todo-1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var todo = await response.Content.ReadFromJsonAsync<TodoDto>();
        Assert.NotNull(todo);
        Assert.Equal("todo-1", todo.Id);
    }

    [Fact]
    public async Task GetTodoById_NonExistentTodo_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/todos/todo-does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateTodo_ValidInput_ReturnsCreated()
    {
        var response = await _client.PostAsJsonAsync("/api/todos", new
        {
            title = "New Integration Test Task",
            assigneeId = "user-1"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var todo = await response.Content.ReadFromJsonAsync<TodoDto>();
        Assert.NotNull(todo);
        Assert.Equal("New Integration Test Task", todo.Title);
        Assert.Equal("user-1", todo.AssigneeId);
        Assert.False(todo.Completed);
        Assert.NotEmpty(todo.Id);
    }

    [Fact]
    public async Task CreateTodo_EmptyTitle_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/todos", new
        {
            title = "",
            assigneeId = "user-1"
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateTodo_MissingAssigneeId_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/todos", new
        {
            title = "Valid Title",
            assigneeId = ""
        });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ToggleTodo_ExistingTodo_FlipsCompletedState()
    {
        // todo-2 seeds as completed=false
        var before = await _client.GetAsync("/api/todos/todo-2");
        var todoBefore = await before.Content.ReadFromJsonAsync<TodoDto>();
        Assert.NotNull(todoBefore);
        Assert.False(todoBefore.Completed);

        var toggle = await _client.PutAsync("/api/todos/todo-2/toggle", null);
        Assert.Equal(HttpStatusCode.OK, toggle.StatusCode);

        var todoAfter = await toggle.Content.ReadFromJsonAsync<TodoDto>();
        Assert.NotNull(todoAfter);
        Assert.True(todoAfter.Completed);
    }

    [Fact]
    public async Task ToggleTodo_NonExistentTodo_ReturnsNotFound()
    {
        var response = await _client.PutAsync("/api/todos/todo-does-not-exist/toggle", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTodo_ExistingTodo_ReturnsNoContent()
    {
        // First create a temporary todo to delete
        var create = await _client.PostAsJsonAsync("/api/todos", new
        {
            title = "Temporary delete test",
            assigneeId = "user-1"
        });
        var created = await create.Content.ReadFromJsonAsync<TodoDto>();
        Assert.NotNull(created);

        var delete = await _client.DeleteAsync($"/api/todos/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        // Confirm it no longer exists
        var get = await _client.GetAsync($"/api/todos/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task DeleteTodo_NonExistentTodo_ReturnsNotFound()
    {
        var response = await _client.DeleteAsync("/api/todos/todo-does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

/// <summary>
/// Integration tests for Chaos simulation (/api/chaos).
/// </summary>
public class ChaosEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ChaosEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("X-Skip-Latency", "true");
    }

    [Fact]
    public async Task GetChaosStatus_ReturnsOk_DefaultsToInactive()
    {
        var response = await _client.GetAsync("/api/chaos");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ChaosStatusDto>();
        Assert.NotNull(body);
        Assert.False(body.ChaosActive);
    }

    [Fact]
    public async Task PostTodo_WithChaosHeader_Returns500()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/todos");
        request.Content = JsonContent.Create(new { title = "Test Task", assigneeId = "user-1" });
        request.Headers.Add("X-Simulate-Chaos", "true");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task PostTodo_WithChaosHeader_ReturnsExpectedErrorPayload()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/todos");
        request.Content = JsonContent.Create(new { title = "Chaos Test Task", assigneeId = "user-1" });
        request.Headers.Add("X-Simulate-Chaos", "true");

        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<ChaosErrorDto>();

        Assert.NotNull(body);
        Assert.Equal("Simulated Network Failure", body.Error);
    }

    [Fact]
    public async Task ToggleChaos_ThenCreateTodo_Returns500()
    {
        // Activate chaos globally via the API
        await _client.PostAsJsonAsync("/api/chaos/toggle", new { });

        try
        {
            var response = await _client.PostAsJsonAsync("/api/todos", new
            {
                title = "Chaos globally active",
                assigneeId = "user-1"
            });
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            // Always deactivate after test
            await _client.PostAsJsonAsync("/api/chaos/toggle", new { });
        }
    }
}

/// <summary>
/// Integration test for the /api/health endpoint.
/// </summary>
public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Add("X-Skip-Latency", "true");
    }

    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task HealthCheck_ReturnsExpectedPayload()
    {
        var response = await _client.GetAsync("/api/health");
        var body = await response.Content.ReadFromJsonAsync<HealthDto>();

        Assert.NotNull(body);
        Assert.Equal("ok", body.Status);
        Assert.Equal("bff", body.Mode);
    }
}

// ── Minimal DTOs for JSON deserialization in tests ──────────────────────────

file record UserDto(string Id, string Username, string CreatedAt, int? TaskCount);
file record TodoDto(string Id, string Title, string AssigneeId, bool Completed, string CreatedAt);
file record ChaosStatusDto(bool ChaosActive, string Description);
file record ChaosErrorDto(string Error, string Message, DateTime Timestamp);
file record HealthDto(string Status, string Mode, string Version, DateTime Timestamp);
