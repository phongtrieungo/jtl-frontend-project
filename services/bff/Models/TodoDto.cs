namespace Bff.Models;

/// <summary>
/// Data transfer object representing a Todo item.
/// </summary>
public record TodoDto(
    string Id,
    string Title,
    string AssigneeId,
    bool Completed,
    string CreatedAt
);
