using Bff.Models;
using Bff.Services;

namespace Bff.Endpoints;

/// <summary>
/// Route mappings for User endpoints (/api/users).
/// </summary>
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
        .WithSummary("Retrieves all users with assigned task counts")
        .Produces<IReadOnlyList<UserDto>>(StatusCodes.Status200OK);

        group.MapGet("/{id}", async (string id, IUserStore store) =>
        {
            var user = await store.GetByIdAsync(id);
            return user is not null
                ? Results.Ok(user)
                : Results.NotFound(new { error = $"User with ID '{id}' not found." });
        })
        .WithName("GetUserById")
        .WithSummary("Retrieves a user profile by ID")
        .Produces<UserDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (CreateUserRequest request, IUserStore store) =>
        {
            if (string.IsNullOrWhiteSpace(request?.Username) || request.Username.Trim().Length < 3)
            {
                return Results.BadRequest(new { error = "Username must be at least 3 characters long." });
            }

            var created = await store.CreateAsync(request.Username.Trim());
            return Results.Created($"/api/users/{created.Id}", created);
        })
        .WithName("CreateUser")
        .WithSummary("Creates a new user")
        .Produces<UserDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);

        return group;
    }
}
