using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Text;
using WebApplication1.Data;

namespace WebApplication1.Services
{
    /// <summary>
    /// Sends one email reminder one calendar day before:
    /// 1) each doctor's scheduled clinical timeslot(s), and
    /// 2) each patient's active appointment.
    ///
    /// CareSyncEmailService uses the existing application configuration directly.
    /// JWT/authentication is not changed or required by this background service.
    /// </summary>
    public sealed class AppointmentReminderService : BackgroundService
    {
        private readonly ILogger<AppointmentReminderService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);

        public AppointmentReminderService(
            ILogger<AppointmentReminderService> logger,
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "CareSync appointment reminder service started. Reminders are checked every {Minutes} minutes.",
                _checkInterval.TotalMinutes);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var emailService = new CareSyncEmailService(_configuration);

                    var hospitalNow = GetSriLankaNow();
                    var targetDate = hospitalNow.Date.AddDays(1);

                    await SendDoctorRemindersAsync(
                        db,
                        emailService,
                        hospitalNow,
                        targetDate,
                        stoppingToken);

                    await SendPatientRemindersAsync(
                        db,
                        emailService,
                        hospitalNow,
                        targetDate,
                        stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while processing CareSync reminder emails.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task SendDoctorRemindersAsync(
            ApplicationDbContext db,
            CareSyncEmailService emailService,
            DateTime hospitalNow,
            DateTime targetDate,
            CancellationToken cancellationToken)
        {
            var tomorrowSlots = await db.MED_TIMESLOT
                .Where(slot =>
                    slot.MT_SLOT_DATE.Date == targetDate.Date &&
                    slot.MT_TIMESLOT_STATUS != "I" &&
                    slot.MT_DELETE_STATUS != "Y" &&
                    slot.MT_DELETE_STATUS != "y" &&
                    !slot.MT_REMINDER_EMAIL_SENT)
                .OrderBy(slot => slot.MT_START_TIME)
                .ToListAsync(cancellationToken);

            var doctorGroups = tomorrowSlots
                .Where(slot => !string.IsNullOrWhiteSpace(slot.MT_USER_ID))
                .GroupBy(slot => slot.MT_USER_ID!);

            foreach (var group in doctorGroups)
            {
                var doctor = await db.MED_USER_DETAILS
                    .AsNoTracking()
                    .FirstOrDefaultAsync(user =>
                        user.MUD_USER_ID == group.Key &&
                        user.MUD_USER_TYPE == "Doc" &&
                        (user.MUD_STATUS == null || user.MUD_STATUS == "A"),
                        cancellationToken);

                if (doctor == null || string.IsNullOrWhiteSpace(doctor.MUD_EMAIL))
                {
                    _logger.LogWarning(
                        "Doctor reminder skipped for user {UserId}: active doctor/email not found.",
                        group.Key);
                    continue;
                }

                var doctorName = !string.IsNullOrWhiteSpace(doctor.MUD_FULL_NAME)
                    ? doctor.MUD_FULL_NAME.Trim()
                    : doctor.MUD_USER_NAME?.Trim() ?? "Doctor";

                var schedule = new StringBuilder();
                schedule.AppendLine($"Your CareSync clinical schedule for tomorrow ({targetDate:dddd, dd MMMM yyyy}) is:");
                schedule.AppendLine();

                foreach (var slot in group.OrderBy(item => item.MT_START_TIME))
                {
                    var room = string.IsNullOrWhiteSpace(slot.MT_CLINIC_ROOM)
                        ? "Room not specified"
                        : slot.MT_CLINIC_ROOM.Trim();
                    var channel = string.IsNullOrWhiteSpace(slot.MT_DELIVERY_CHANNEL)
                        ? "Physical"
                        : slot.MT_DELIVERY_CHANNEL.Trim();
                    var capacity = slot.MT_MAXIMUM_PATIENTS ?? 0;

                    var startTimeText = slot.MT_START_TIME.ToString(@"hh\:mm");
                    var endTimeText = slot.MT_END_TIME.ToString(@"hh\:mm");
                    schedule.AppendLine(
                        $"• {startTimeText} - {endTimeText} | {room} | {channel} | Booked {slot.MT_PATIENT_NO}/{capacity}");
                }

                schedule.AppendLine();
                schedule.AppendLine("Please review your patient roster in CareSync before the clinic begins.");

                try
                {
                    await emailService.SendNotificationEmailAsync(
                        doctor.MUD_EMAIL,
                        $"Dr. {doctorName}",
                        $"CareSync schedule reminder - {targetDate:dd MMM yyyy}",
                        schedule.ToString());

                    foreach (var slot in group)
                    {
                        slot.MT_REMINDER_EMAIL_SENT = true;
                        slot.MT_REMINDER_EMAIL_SENT_DATE = hospitalNow;
                    }

                    await db.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation(
                        "Doctor reminder sent to {Email} for {Date}.",
                        doctor.MUD_EMAIL,
                        targetDate.ToString("yyyy-MM-dd"));
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to send doctor reminder to {Email}.",
                        doctor.MUD_EMAIL);
                }
            }
        }

        private async Task SendPatientRemindersAsync(
            ApplicationDbContext db,
            CareSyncEmailService emailService,
            DateTime hospitalNow,
            DateTime targetDate,
            CancellationToken cancellationToken)
        {
            var appointments = await db.MED_APPOINMENT_DETAILS
                .Where(appointment =>
                    appointment.MAD_APPOINMENT_DATE.Date == targetDate.Date &&
                    (appointment.MAD_STATUS == null || appointment.MAD_STATUS == "A") &&
                    !appointment.MAD_REMINDER_EMAIL_SENT)
                .OrderBy(appointment => appointment.MAD_ALLOCATED_TIME)
                .ToListAsync(cancellationToken);

            foreach (var appointment in appointments)
            {
                var recipientEmail = appointment.MAD_EMAIL;

                if (string.IsNullOrWhiteSpace(recipientEmail) &&
                    !string.IsNullOrWhiteSpace(appointment.MAD_PATIENT_CODE))
                {
                    recipientEmail = await db.MED_PATIENTS_DETAILS
                        .AsNoTracking()
                        .Where(patient => patient.MPD_PATIENT_CODE == appointment.MAD_PATIENT_CODE)
                        .Select(patient => patient.MPD_EMAIL)
                        .FirstOrDefaultAsync(cancellationToken);
                }

                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    _logger.LogWarning(
                        "Patient reminder skipped for appointment {AppointmentId}: no email address is available.",
                        appointment.MAD_APPOINMENT_ID);
                    continue;
                }

                var patientName = string.IsNullOrWhiteSpace(appointment.MAD_FULL_NAME)
                    ? "Patient"
                    : appointment.MAD_FULL_NAME.Trim();
                var doctorName = string.IsNullOrWhiteSpace(appointment.MAD_DOCTOR)
                    ? "your doctor"
                    : appointment.MAD_DOCTOR.Trim();
                var appointmentTime = appointment.MAD_ALLOCATED_TIME ?? appointment.MAD_START_TIME;
                var timeText = appointmentTime.HasValue
                    ? appointmentTime.Value.ToString(@"hh\:mm")
                    : "Time to be confirmed";

                var message =
                    $"This is your CareSync appointment reminder for tomorrow.\n\n" +
                    $"Date: {targetDate:dddd, dd MMMM yyyy}\n" +
                    $"Time: {timeText}\n" +
                    $"Doctor: Dr. {doctorName}\n" +
                    $"Appointment #: {appointment.MAD_APPOINMENT_ID}\n\n" +
                    "Please arrive around 15 minutes early and bring any relevant medical documents. " +
                    "If you cannot attend, please contact the hospital to cancel or reschedule.";

                try
                {
                    await emailService.SendNotificationEmailAsync(
                        recipientEmail,
                        patientName,
                        $"CareSync appointment reminder - {targetDate:dd MMM yyyy}",
                        message);

                    appointment.MAD_EMAIL = recipientEmail;
                    appointment.MAD_REMINDER_EMAIL_SENT = true;
                    appointment.MAD_REMINDER_EMAIL_SENT_DATE = hospitalNow;
                    await db.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation(
                        "Patient reminder sent for appointment {AppointmentId}.",
                        appointment.MAD_APPOINMENT_ID);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Failed to send patient reminder for appointment {AppointmentId}.",
                        appointment.MAD_APPOINMENT_ID);
                }
            }
        }

        private static DateTime GetSriLankaNow()
        {
            foreach (var zoneId in new[] { "Asia/Colombo", "Sri Lanka Standard Time" })
            {
                try
                {
                    var zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
                    return TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, zone).DateTime;
                }
                catch (TimeZoneNotFoundException)
                {
                    // Try the next cross-platform identifier.
                }
                catch (InvalidTimeZoneException)
                {
                    // Try the next cross-platform identifier.
                }
            }

            return DateTime.Now;
        }
    }
}
