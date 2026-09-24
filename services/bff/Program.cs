using Bff.Endpoints;
using Bff.Middleware;
using Bff.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Dependency Injection / Stores ──────────────────────────────────────────
builder.Services.AddSingleton<ITodoStore, InMemoryTodoStore>();
builder.Services.AddSingleton<IUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<IChaosService, ChaosService>();

// ── CORS ───────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── OpenAPI / Swagger ───────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "User & ToDo BFF",
        Version = "v1",
        Description = "Backend-for-Frontend Minimal API (ASP.NET Core .NET 8) — in-memory store with chaos simulation middleware."
    });
});

var app = builder.Build();

// ── Middleware Pipeline ────────────────────────────────────────────────────
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BFF v1"));
}

// Register Chaos & Latency Simulation Middleware
app.UseMiddleware<ChaosAndLatencyMiddleware>();

// ── Health Check ────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    mode = "bff",
    service = "bff",
    version = "1.0.0",
    timestamp = DateTime.UtcNow
}))
.WithName("HealthCheck")
.WithTags("Health")
.WithSummary("Health check endpoint for frontend dual-mode auto-detection");

// ── Feature Endpoint Groups ────────────────────────────────────────────────
app.MapGroup("/api/users")
   .WithTags("Users")
   .MapUserEndpoints();

app.MapGroup("/api/todos")
   .WithTags("Todos")
   .MapTodoEndpoints();

app.MapGroup("/api/chaos")
   .WithTags("Chaos")
   .MapChaosEndpoints();

app.Run();

// Make the implicit Program class public so test projects can access it via WebApplicationFactory<Program>
public partial class Program { }
