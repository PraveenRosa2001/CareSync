using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WebApplication1.Data; // Assuming your ApplicationDbContext is in this namespace

public class TimeslotReschedulerCronService
{
    private readonly ILogger<TimeslotReschedulerCronService> _logger;
    private readonly ApplicationDbContext _context; // Your DB context
    private Timer _timer;

    public TimeslotReschedulerCronService(ApplicationDbContext context, ILogger<TimeslotReschedulerCronService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        // Set up the timer to trigger every 24 hours (for example)
        _logger.LogInformation("Timeslot Rescheduler Cron Service is starting.");



        //Run the task initially




        return Task.CompletedTask;
    }






}
