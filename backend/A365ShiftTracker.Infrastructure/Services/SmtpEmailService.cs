using A365ShiftTracker.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace A365ShiftTracker.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;

    public SmtpEmailService(IConfiguration config) => _config = config;

    public async Task SendOtpEmailAsync(string toEmail, string displayName, string code)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
        var username  = _config["Smtp:Username"] ?? string.Empty;
        var password  = _config["Smtp:Password"] ?? string.Empty;
        var fromName  = _config["Smtp:FromName"] ?? "A365 CRM";
        var fromEmail = _config["Smtp:FromEmail"] ?? username;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(displayName, toEmail));
        message.Subject = "Your A365 CRM Login Code";

        message.Body = new TextPart("html")
        {
            Text = $"""
                <div style="font-family:DM Sans,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                  <h2 style="color:#1e293b;margin-bottom:8px;">Your login code</h2>
                  <p style="color:#64748b;margin-bottom:24px;">Use this code to complete your A365 CRM sign-in. It expires in <strong>5 minutes</strong>.</p>
                  <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#4361EE;text-align:center;padding:20px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">{code}</div>
                  <p style="color:#94a3b8;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
                """
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string displayName, string resetLink)
    {
        var smtpHost = _config["Smtp:Host"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
        var username  = _config["Smtp:Username"] ?? string.Empty;
        var password  = _config["Smtp:Password"] ?? string.Empty;
        var fromName  = _config["Smtp:FromName"] ?? "A365 CRM";
        var fromEmail = _config["Smtp:FromEmail"] ?? username;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(displayName, toEmail));
        message.Subject = "Reset your A365 CRM password";

        var safeDisplayName = System.Net.WebUtility.HtmlEncode(displayName);
        var safeResetLink   = System.Net.WebUtility.HtmlEncode(resetLink);

        message.Body = new TextPart("html")
        {
            Text = $"""
                <div style="font-family:DM Sans,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
                  <h2 style="color:#1e293b;margin-bottom:8px;">Reset your password</h2>
                  <p style="color:#64748b;margin-bottom:24px;">Hi {safeDisplayName}, click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
                  <a href="{safeResetLink}" style="display:inline-block;padding:12px 24px;background:#4361EE;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-bottom:24px;">Reset Password</a>
                  <p style="color:#94a3b8;font-size:12px;">If you did not request a password reset, you can safely ignore this email.</p>
                </div>
                """
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
