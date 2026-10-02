//using Microsoft.Extensions.Options;
//using System.Net;
//using System.Net.Mail;

//namespace WebApplication1.Services
//{
//    public sealed class SmtpEmailSender : IEmailSender
//    {
//        private readonly EmailSettings _settings;
//        private readonly ILogger<SmtpEmailSender> _logger;

//        public SmtpEmailSender(
//            IOptions<EmailSettings> settings,
//            ILogger<SmtpEmailSender> logger)
//        {
//            _settings = settings.Value;
//            _logger = logger;
//        }

//        public async Task SendAsync(
//            string recipientEmail,
//            string subject,
//            string htmlBody,
//            CancellationToken cancellationToken = default)
//        {
//            if (!_settings.Enabled)
//            {
//                throw new InvalidOperationException(
//                    "Email sending is disabled. Set EmailSettings:Enabled to true after configuring SMTP credentials.");
//            }

//            if (string.IsNullOrWhiteSpace(_settings.Host) ||
//                string.IsNullOrWhiteSpace(_settings.FromEmail) ||
//                string.IsNullOrWhiteSpace(recipientEmail))
//            {
//                throw new InvalidOperationException("SMTP email settings are incomplete.");
//            }

//            using var message = new MailMessage
//            {
//                From = new MailAddress(_settings.FromEmail, _settings.FromName),
//                Subject = subject,
//                Body = htmlBody,
//                IsBodyHtml = true
//            };
//            message.To.Add(new MailAddress(recipientEmail));

//            using var smtp = new SmtpClient(_settings.Host, _settings.Port)
//            {
//                EnableSsl = _settings.UseSsl,
//                DeliveryMethod = SmtpDeliveryMethod.Network,
//                UseDefaultCredentials = false
//            };

//            if (!string.IsNullOrWhiteSpace(_settings.Username))
//            {
//                smtp.Credentials = new NetworkCredential(
//                    _settings.Username,
//                    _settings.Password);
//            }

//            _logger.LogInformation("Sending reminder email to {Recipient}.", recipientEmail);
//            await smtp.SendMailAsync(message).WaitAsync(cancellationToken);
//        }
//    }
//}


using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace WebApplication1.Services
{
    public sealed class SmtpEmailSender : IEmailSender
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(
            IOptions<EmailSettings> settings,
            ILogger<SmtpEmailSender> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendAsync(
            string recipientEmail,
            string subject,
            string htmlBody,
            CancellationToken cancellationToken = default)
        {
            if (!_settings.Enabled)
            {
                throw new InvalidOperationException(
                    "Email sending is disabled. Set EmailSettings:Enabled to true after configuring SMTP credentials.");
            }

            if (string.IsNullOrWhiteSpace(_settings.Host) ||
                string.IsNullOrWhiteSpace(_settings.FromEmail) ||
                string.IsNullOrWhiteSpace(recipientEmail))
            {
                throw new InvalidOperationException("SMTP email settings are incomplete.");
            }

            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail.Trim(), _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(recipientEmail.Trim()));

            using var smtp = new SmtpClient(_settings.Host.Trim(), _settings.Port)
            {
                EnableSsl = _settings.UseSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Timeout = 20000
            };

            if (!string.IsNullOrWhiteSpace(_settings.Username))
            {
                var password = _settings.Password ?? string.Empty;

                // Google displays App Passwords grouped with spaces. SMTP expects the
                // actual 16-character password. Only normalize spaces for Gmail.
                if (_settings.Host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
                {
                    password = password.Replace(" ", string.Empty);
                }

                smtp.Credentials = new NetworkCredential(
                    _settings.Username.Trim(),
                    password);
            }

            _logger.LogInformation("Sending CareSync email to {Recipient}.", recipientEmail);
            await smtp.SendMailAsync(message).WaitAsync(cancellationToken);
        }
    }
}
