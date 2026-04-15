namespace A365ShiftTracker.Application.Common;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? UserName { get; }
    string? IpAddress { get; }
}
