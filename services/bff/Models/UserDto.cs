namespace Bff.Models;

/// <summary>
/// Data transfer object representing a User.
/// </summary>
public record UserDto(
    string Id,
    string Username,
    string CreatedAt,
    int? TaskCount = null
);
