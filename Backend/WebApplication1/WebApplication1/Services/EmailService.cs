using Microsoft.Extensions.Configuration;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace WebApplication1.Services
{
    /// <summary>
    /// All outbound email the API sends - OTP codes and plain notifications alike -
    /// goes through this one abstraction so every controller sends mail the same way.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>Sends a one-time passcode (patient login, staff password reset, ...).</summary>
        Task SendOtpEmailAsync(string toEmail, string? recipientName, string otpCode, string purposeDescription);

        /// <summary>
        /// Sends a plain informational email (appointment confirmations/reminders,
        /// prescription summaries, etc.) - replaces what used to go out over SMS.
        /// </summary>
        Task SendNotificationEmailAsync(string toEmail, string? recipientName, string subject, string message);
    }

    /// <summary>
    /// Sends email through Gmail's SMTP relay (smtp.gmail.com:587) authenticated with a
    /// Google App Password - the same pattern used previously for the "forgot password"
    /// recovery mail. Configure the sender account under the "Email" section of
    /// appsettings.json. Requires the Gmail account to have 2-Step Verification turned on
    /// so an App Password can be generated for it.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendOtpEmailAsync(string toEmail, string? recipientName, string otpCode, string purposeDescription)
        {
            var displayName = string.IsNullOrWhiteSpace(recipientName) ? toEmail : recipientName;
            var body = EmailTemplate.OtpBody(displayName, otpCode, purposeDescription);
            return SendAsync(toEmail, "Your Medicare verification code", body);
        }

        public Task SendNotificationEmailAsync(string toEmail, string? recipientName, string subject, string message)
        {
            var displayName = string.IsNullOrWhiteSpace(recipientName) ? toEmail : recipientName;
            var body = EmailTemplate.NotificationBody(displayName, message);
            return SendAsync(toEmail, subject, body);
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                throw new ArgumentException("Recipient email is required.", nameof(toEmail));
            }

            var host = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var port = int.TryParse(_configuration["Email:SmtpPort"], out var parsedPort) ? parsedPort : 587;
            var senderEmail = _configuration["Email:SenderEmail"];
            var senderName = _configuration["Email:SenderName"] ?? "Medicare";
            var appPassword = _configuration["Email:AppPassword"];

            if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(appPassword))
            {
                throw new InvalidOperationException(
                    "Email sending is not configured. Set Email:SenderEmail and Email:AppPassword " +
                    "(a Gmail App Password, not the account's normal password) in configuration.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                IsBodyHtml = true,
                Body = htmlBody
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(senderEmail, appPassword),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            await client.SendMailAsync(message);
        }
    }

    /// <summary>
    /// Small, self-contained HTML templates so every Medicare email shares the same
    /// look, without pulling in a templating library for two layouts.
    /// </summary>
    internal static class EmailTemplate
    {
        private const string BrandColor = "#1976d2";

        public static string OtpBody(string displayName, string otpCode, string purposeDescription)
        {
            var safeName = WebUtility.HtmlEncode(displayName);
            var safePurpose = WebUtility.HtmlEncode(purposeDescription);
            var safeCode = WebUtility.HtmlEncode(otpCode);

            var content = $@"
                <p style=""margin:0 0 16px 0;"">Hi {safeName},</p>
                <p style=""margin:0 0 24px 0;"">{safePurpose}</p>
                <div style=""text-align:center;margin:0 0 24px 0;"">
                    <span style=""display:inline-block;font-size:32px;font-weight:700;letter-spacing:10px;
                                 color:{BrandColor};background:#eaf3fc;padding:14px 20px;border-radius:8px;"">
                        {safeCode}
                    </span>
                </div>
                <p style=""margin:0;color:#555;"">This code expires in <strong>5 minutes</strong>. If you didn't
                request it, you can safely ignore this email.</p>";

            return Shell("Verify your identity", content);
        }

        public static string NotificationBody(string displayName, string message)
        {
            var safeName = WebUtility.HtmlEncode(displayName);
            var safeMessage = WebUtility.HtmlEncode(message).Replace("\n", "<br/>");

            var content = $@"
                <p style=""margin:0 0 16px 0;"">Hi {safeName},</p>
                <p style=""margin:0;line-height:1.6;"">{safeMessage}</p>";

            return Shell("Medicare Notification", content);
        }

        private static string Shell(string heading, string innerHtml) => $@"
<div style=""background:#f2f4f7;padding:32px 16px;font-family:'Segoe UI',Arial,sans-serif;"">
  <div style=""max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;
              box-shadow:0 2px 10px rgba(0,0,0,0.06);"">
    <div style=""background:{BrandColor};padding:20px 28px;"">
      <span style=""color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;"">Medicare</span>
    </div>
    <div style=""padding:28px;color:#222;font-size:15px;"">
      <h2 style=""margin:0 0 16px 0;font-size:17px;color:{BrandColor};"">{WebUtility.HtmlEncode(heading)}</h2>
      {innerHtml}
    </div>
    <div style=""background:#fafafa;padding:16px 28px;border-top:1px solid #eee;"">
      <p style=""margin:0;font-size:12px;color:#999;"">This is an automated message from Medicare - please do not reply to this email.</p>
    </div>
  </div>
</div>";
    }
}