var builder = WebApplication.CreateBuilder(args);

// ── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ── OpenAPI / Swagger ─────────────────────────────────────────────────────────
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

// ── Middleware ────────────────────────────────────────────────────────────────
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BFF v1"));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "bff",
    version = "0.1.0",
    timestamp = DateTime.UtcNow
})).WithTags("Health");

// ── Placeholder endpoint stubs (expanded in Sprint 3) ────────────────────────
app.MapGet("/api/users", () => Results.Ok(Array.Empty<object>()))
   .WithTags("Users").WithSummary("List all users");

app.MapGet("/api/todos", () => Results.Ok(Array.Empty<object>()))
   .WithTags("Todos").WithSummary("List todos (filtered by userId)");

app.Run("http://localhost:5000");
