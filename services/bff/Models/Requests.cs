namespace Bff.Models;

/// <summary>
/// Request payload for creating a user.
/// </summary>
public record CreateUserRequest(string? Username);

/// <summary>
/// Request payload for creating a todo item.
/// </summary>
public record CreateTodoRequest(string? Title, string? AssigneeId);

/// <summary>
/// Request payload for updating a todo item.
/// </summary>
public record UpdateTodoRequest(string? Title, bool? Completed, string? AssigneeId);

/// <summary>
/// Request payload for updating chaos state.
/// </summary>
public record SetChaosRequest(bool? Enabled);
