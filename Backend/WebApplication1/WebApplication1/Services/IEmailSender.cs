namespace WebApplication1.Services
{
    public interface IEmailSender
    {
        Task SendAsync(
            string recipientEmail,
            string subject,
            string htmlBody,
            CancellationToken cancellationToken = default);
    }
}
