using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;

namespace WebApplication1.Services
{
    /// <summary>
    /// Timeslot maintenance only.
    /// Automatic future-timeslot generation has deliberately been removed.
    /// New clinical sessions are created only through the administrator scheduler.
    /// </summary>
    public sealed class CronJobService : BackgroundService
    {
        private readonly ILogger<CronJobService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public CronJobService(
            ILogger<CronJobService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "Timeslot maintenance started. Automatic timeslot generation is disabled.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var today = DateTime.Today;

                    var expiredSlots = await db.MED_TIMESLOT
                        .Where(slot =>
                            slot.MT_SLOT_DATE < today &&
                            slot.MT_TIMESLOT_STATUS != "I")
                        .ToListAsync(stoppingToken);

                    if (expiredSlots.Count > 0)
                    {
                        foreach (var slot in expiredSlots)
                        {
                            slot.MT_TIMESLOT_STATUS = "I";
                        }

                        await db.SaveChangesAsync(stoppingToken);
                        _logger.LogInformation(
                            "Marked {Count} past timeslots inactive. No new timeslots were created.",
                            expiredSlots.Count);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Timeslot maintenance failed.");
                }

                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
        }
    }
}
