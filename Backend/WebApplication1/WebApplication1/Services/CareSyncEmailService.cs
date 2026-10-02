using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace WebApplication1.Services
{
    /// <summary>
    /// CareSync SMTP sender used directly by controllers/background reminders.
    /// It intentionally has no IEmailService dependency so unrelated API endpoints
    /// cannot fail controller activation because of missing DI registration.
    /// </summary>
    public sealed class CareSyncEmailService
    {
        private readonly IConfiguration _configuration;

        public CareSyncEmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendNotificationEmailAsync(
            string toEmail,
            string? recipientName,
            string subject,
            string message)
        {
            var displayName = string.IsNullOrWhiteSpace(recipientName)
                ? toEmail
                : recipientName.Trim();

            var safeMessage = WebUtility.HtmlEncode(message ?? string.Empty)
                .Replace("\r\n", "<br/>")
                .Replace("\n", "<br/>");

            var html = BuildHtml(subject, displayName, safeMessage);
            return SendAsync(toEmail, subject, html);
        }

        public Task SendOtpEmailAsync(
            string toEmail,
            string? recipientName,
            string otpCode,
            string purposeDescription)
        {
            var displayName = string.IsNullOrWhiteSpace(recipientName)
                ? toEmail
                : recipientName.Trim();

            var safePurpose = WebUtility.HtmlEncode(purposeDescription ?? string.Empty);
            var safeCode = WebUtility.HtmlEncode(otpCode ?? string.Empty);

            var content =
                $"{safePurpose}<br/><br/>" +
                $"<div style='font-size:30px;font-weight:700;letter-spacing:8px;color:#087fa5;'>" +
                $"{safeCode}</div>";

            var html = BuildHtml("CareSync verification code", displayName, content);
            return SendAsync(toEmail, "Your CareSync verification code", html);
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new ArgumentException("Recipient email address is required.", nameof(toEmail));

            var host = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            var port = int.TryParse(_configuration["Email:SmtpPort"], out var parsedPort)
                ? parsedPort
                : 587;
            var senderEmail = _configuration["Email:SenderEmail"];
            var senderName = _configuration["Email:SenderName"] ?? "CareSync";
            var appPassword = _configuration["Email:AppPassword"];

            if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(appPassword))
            {
                throw new InvalidOperationException(
                    "CareSync email is not configured. Set Email:SenderEmail and Email:AppPassword " +
                    "in appsettings.json or user-secrets.");
            }

            using var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            mail.To.Add(toEmail.Trim());

            using var smtp = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(senderEmail, appPassword),
                EnableSsl = true,
                UseDefaultCredentials = false,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            await smtp.SendMailAsync(mail);
        }

        private static string BuildHtml(string heading, string recipientName, string content)
        {
            var safeHeading = WebUtility.HtmlEncode(heading ?? "CareSync notification");
            var safeName = WebUtility.HtmlEncode(recipientName ?? "Patient");

            return $@"
<div style=""background:#f4f8fa;padding:30px 16px;font-family:'Segoe UI',Arial,sans-serif;"">
  <div style=""max-width:560px;margin:auto;background:#fff;border:1px solid #e3edf1;border-radius:14px;overflow:hidden;"">
    <div style=""background:#087fa5;color:#fff;padding:20px 26px;"">
      <div style=""font-size:22px;font-weight:700;"">CareSync</div>
      <div style=""font-size:12px;opacity:.85;"">Hospital Management System</div>
    </div>
    <div style=""padding:26px;color:#17202a;font-size:15px;line-height:1.65;"">
      <h2 style=""margin:0 0 18px;color:#087fa5;font-size:18px;"">{safeHeading}</h2>
      <p style=""margin:0 0 16px;"">Hello {safeName},</p>
      <div>{content}</div>
    </div>
    <div style=""padding:14px 26px;background:#f8fafb;border-top:1px solid #edf1f3;color:#78828c;font-size:12px;"">
      Automated message from CareSync.
    </div>
  </div>
</div>";
        }
    }
}
