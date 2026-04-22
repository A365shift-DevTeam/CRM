namespace A365ShiftTracker.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string displayName, string code);
    Task SendPasswordResetEmailAsync(string toEmail, string displayName, string resetLink);
}
