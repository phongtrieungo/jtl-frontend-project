---
name: backend-dotnet
description: Architectural standards, coding patterns, thread-safe in-memory stores, chaos/latency middleware, CORS, OpenAPI/Swagger, and testing recipes for the ASP.NET Core .NET 8 Minimal API BFF in services/bff.
---

# Backend .NET 8 Minimal API Guidelines & Architecture

This skill defines the architectural standards, coding conventions, middleware patterns, and testing strategies for the **Backend-for-Frontend (BFF)** service located in `services/bff`.

---

## 1. Architectural Philosophy & Boundaries

The BFF is built as a lightweight, high-performance **ASP.NET Core .NET 8 Minimal API** service. Its primary purpose is to aggregate, shape, and serve data specifically tailored to the frontend's needs while keeping infrastructure requirements minimal.

### Boundary Rules
1. **Zero Frontend Coupling:** The .NET BFF service does not reference, import, or bundle any JavaScript/TypeScript modules or Node artifacts.
2. **Contract-First Communication:** All interaction occurs strictly over standard HTTP REST contracts with JSON payloads, mirrored by the TypeScript interfaces in `packages/shared/src/types/domain.ts`.
3. **Zero Database Infrastructure Dependency:** The service uses thread-safe in-memory collections (`ConcurrentDictionary`) seeded with initial records. Reviewers do not need to install or run PostgreSQL, SQL Server, or Docker to run the BFF.

---

## 2. Project Layout & Minimal API Conventions

```
services/bff/
├── Endpoints/
│   ├── UserEndpoints.cs       # Extension methods for /api/users
│   └── TodoEndpoints.cs       # Extension methods for /api/todos
├── Middleware/
│   └── ChaosAndLatencyMiddleware.cs # Latency & chaos simulation engine
├── Models/
│   ├── UserDto.cs             # Response DTOs
│   ├── TodoDto.cs
│   └── Requests.cs            # CreateUserRequest, CreateTodoRequest
├── Services/
│   ├── IUserStore.cs          # Repository interfaces
│   ├── InMemoryUserStore.cs
│   ├── ITodoStore.cs
│   ├── InMemoryTodoStore.cs
│   └── ChaosService.cs        # Chaos state coordinator
├── Program.cs                 # Service bootstrap, DI, CORS, Swagger
├── appsettings.json
└── bff.csproj                 # TargetFramework: net8.0
```

### 2.1 Route Mapping via Endpoint Groups
Avoid bloated `Program.cs` files by organizing routes into static extension classes using `RouteGroupBuilder`:

```csharp
public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async (IUserStore store) =>
        {
            var users = await store.GetAllAsync();
            return Results.Ok(users);
        })
        .WithName("GetUsers")
        .WithSummary("Retrieves all users with assigned task counts");

        group.MapGet("/{id}", async (string id, IUserStore store) =>
        {
            var user = await store.GetByIdAsync(id);
            return user is not null ? Results.Ok(user) : Results.NotFound(new { message = $"User '{id}' not found." });
        })
        .WithName("GetUserById")
        .WithSummary("Retrieves a user profile by ID");

        group.MapPost("/", async (CreateUserRequest request, IUserStore store) =>
        {
            if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length < 3)
            {
                return Results.BadRequest(new { error = "Username must be at least 3 characters." });
            }

            var created = await store.CreateAsync(request.Username.Trim());
            return Results.Created($"/api/users/{created.Id}", created);
        })
        .WithName("CreateUser")
        .WithSummary("Creates a new user");

        return group;
    }
}
```

---

## 3. Thread-Safe In-Memory Storage Patterns

All data stores must ensure safe concurrent reads and writes using `ConcurrentDictionary`:

```csharp
public interface ITodoStore
{
    Task<IReadOnlyList<TodoDto>> GetByUserAsync(string userId);
    Task<TodoDto?> GetByIdAsync(string id);
    Task<TodoDto> CreateAsync(string title, string assigneeId);
    Task<TodoDto?> ToggleCompleteAsync(string id);
}

public class InMemoryTodoStore : ITodoStore
{
    private readonly ConcurrentDictionary<string, TodoDto> _todos = new();

    public InMemoryTodoStore()
    {
        // Pre-seed with realistic demo tasks
        SeedDefaultTodos();
    }

    public Task<IReadOnlyList<TodoDto>> GetByUserAsync(string userId)
    {
        var list = _todos.Values
            .Where(t => string.Equals(t.AssigneeId, userId, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(t => t.CreatedAt)
            .ToList();
        return Task.FromResult<IReadOnlyList<TodoDto>>(list);
    }

    public Task<TodoDto> CreateAsync(string title, string assigneeId)
    {
        var id = $"todo-{Guid.NewGuid().ToString()[..8]}";
        var todo = new TodoDto(id, title, assigneeId, false, DateTime.UtcNow.ToString("o"));
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
}
```

---

## 4. Latency & Chaos Simulation Middleware

The middleware enables deterministic verification of the frontend's **Optimistic Rollback** across the real HTTP network boundary:

```csharp
public class ChaosAndLatencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IChaosService _chaosService;

    public ChaosAndLatencyMiddleware(RequestDelegate next, IChaosService chaosService)
    {
        _next = next;
        _chaosService = chaosService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Simulate realistic network latency (200-400ms)
        var delayMs = Random.Shared.Next(200, 400);
        await Task.Delay(delayMs);

        // 2. Check for Chaos trigger (Header or Global Toggle)
        var hasChaosHeader = context.Request.Headers.TryGetValue("X-Simulate-Chaos", out var headerValue) 
                             && string.Equals(headerValue, "true", StringComparison.OrdinalIgnoreCase);

        var isChaosActive = hasChaosHeader || _chaosService.IsChaosActive;

        // 3. Inject simulated failure on mutations (POST / PATCH)
        if (isChaosActive && (HttpMethods.IsPost(context.Request.Method) || HttpMethods.IsPatch(context.Request.Method)))
        {
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
```

---

## 5. CORS, Healthcheck & Swagger Configuration

In `Program.cs`:
```csharp
var builder = WebApplication.CreateBuilder(args);

// Register In-Memory Stores as Singletons
builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<ITodoStore, InMemoryTodoStore>();
builder.Services.AddSingleton<IChaosService, ChaosService>();

// CORS configuration for Vite Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseSwagger();
app.UseSwaggerUI();

// Register Chaos & Latency Middleware
app.UseMiddleware<ChaosAndLatencyMiddleware>();

// Healthcheck endpoint for frontend auto-detection
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", version = "1.0.0" }));

// Map Endpoint Groups
app.MapGroup("/api/users").MapUserEndpoints();
app.MapGroup("/api/todos").MapTodoEndpoints();
app.MapGroup("/api/chaos").MapChaosEndpoints();

app.Run("http://localhost:5000");
```

---

## 6. Integration Testing Recipe (`WebApplicationFactory`)

```csharp
public class TodoEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public TodoEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostTodo_WithChaosHeader_Returns500InternalServerError()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/todos")
        {
            Content = JsonContent.Create(new { title = "Test Task", assigneeId = "user-1" })
        };
        request.Headers.Add("X-Simulate-Chaos", "true");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
```
