using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Services
{
    // Hourly background job that emails tomorrow's patients a reminder of their
    // appointment. Previously sent these over SMS through the esystems.cdl.lk gateway;
    // now sent through Gmail via IEmailService, using the email captured at booking time
    // (MAD_EMAIL) instead of the mobile number.
    public class AppointmentReminderService : BackgroundService
    {
        private readonly ILogger<AppointmentReminderService> _logger;
        private readonly IServiceProvider _services;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

        public AppointmentReminderService(
            ILogger<AppointmentReminderService> logger,
            IServiceProvider services)
        {
            _logger = logger;
            _services = services;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Appointment Reminder Service is running.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _services.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                        // Calculate the target date (tomorrow)
                        var targetDate = DateTime.Now.AddDays(1).Date;

                        // Find appointments for tomorrow that haven't had confirmations sent
                        var appointments = await dbContext.MED_APPOINMENT_DETAILS
                            .Where(a => a.MAD_APPOINMENT_DATE.Date == targetDate &&
                                       !a.MAD_CONFIRMATION_SENT)
                            .ToListAsync(stoppingToken);

                        _logger.LogInformation("Found {Count} appointments needing confirmation.", appointments.Count);

                        foreach (var appointment in appointments)
                        {
                            try
                            {
                                if (string.IsNullOrWhiteSpace(appointment.MAD_EMAIL))
                                {
                                    _logger.LogWarning("Skipping reminder for {Name}: no email on file.", appointment.MAD_FULL_NAME);
                                    continue;
                                }

                                var formattedTime = appointment.MAD_ALLOCATED_TIME?.ToString(@"hh\:mm");
                                var formattedDate = appointment.MAD_APPOINMENT_DATE.ToString("yyyy-MM-dd");

                                string messageBody =
                                    $"This is a reminder for your appointment with Dr. {appointment.MAD_DOCTOR} " +
                                    $"on {formattedDate} at {formattedTime}. Please arrive 15 minutes before your " +
                                    $"scheduled time. If you need to reschedule or cancel, please contact us at 0776970808.";

                                await emailService.SendNotificationEmailAsync(
                                    appointment.MAD_EMAIL,
                                    appointment.MAD_FULL_NAME,
                                    "Your Medicare appointment reminder",
                                    messageBody);

                                appointment.MAD_CONFIRMATION_SENT = true;
                                appointment.MAD_CONFIRMATION_SENT_DATE = DateTime.Now;
                                await dbContext.SaveChangesAsync(stoppingToken);
                                _logger.LogInformation("Sent reminder email to {Name}", appointment.MAD_FULL_NAME);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error sending reminder email to {Name}", appointment.MAD_FULL_NAME);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in Appointment Reminder Service");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }
    }
}