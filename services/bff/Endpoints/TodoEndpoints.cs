using Bff.Models;
using Bff.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bff.Endpoints;

/// <summary>
/// Route mappings for Todo endpoints (/api/todos).
/// </summary>
public static class TodoEndpoints
{
    public static RouteGroupBuilder MapTodoEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/", async ([FromQuery] string? userId, ITodoStore store) =>
        {
            var todos = await store.GetAllAsync(userId);
            return Results.Ok(todos);
        })
        .WithName("GetTodos")
        .WithSummary("Retrieves todos, optionally filtered by user ID")
        .Produces<IReadOnlyList<TodoDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id}", async (string id, ITodoStore store) =>
        {
            var todo = await store.GetByIdAsync(id);
            return todo is not null
                ? Results.Ok(todo)
                : Results.NotFound(new { error = $"Todo with ID '{id}' not found." });
        })
        .WithName("GetTodoById")
        .WithSummary("Retrieves a todo item by ID")
        .Produces<TodoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateTodoRequest request, ITodoStore store) =>
        {
            if (string.IsNullOrWhiteSpace(request?.Title))
            {
                return Results.BadRequest(new { error = "Todo title cannot be empty." });
            }

            if (string.IsNullOrWhiteSpace(request?.AssigneeId))
            {
                return Results.BadRequest(new { error = "Assignee ID is required." });
            }

            var created = await store.CreateAsync(request.Title.Trim(), request.AssigneeId.Trim());
            return Results.Created($"/api/todos/{created.Id}", created);
        })
        .WithName("CreateTodo")
        .WithSummary("Creates a new todo item")
        .Produces<TodoDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{id}/toggle", async (string id, ITodoStore store) =>
        {
            var updated = await store.ToggleCompleteAsync(id);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new { error = $"Todo with ID '{id}' not found." });
        })
        .WithName("ToggleTodo")
        .WithSummary("Toggles the completed status of a todo item")
        .Produces<TodoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPut("/{id}", async (string id, UpdateTodoRequest request, ITodoStore store) =>
        {
            var updated = await store.UpdateAsync(id, request?.Title, request?.Completed, request?.AssigneeId);
            return updated is not null
                ? Results.Ok(updated)
                : Results.NotFound(new { error = $"Todo with ID '{id}' not found." });
        })
        .WithName("UpdateTodo")
        .WithSummary("Updates properties of a todo item")
        .Produces<TodoDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id}", async (string id, ITodoStore store) =>
        {
            var deleted = await store.DeleteAsync(id);
            return deleted
                ? Results.NoContent()
                : Results.NotFound(new { error = $"Todo with ID '{id}' not found." });
        })
        .WithName("DeleteTodo")
        .WithSummary("Deletes a todo item")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);

        return group;
    }
}
