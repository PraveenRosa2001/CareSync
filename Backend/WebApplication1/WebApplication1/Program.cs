using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using WebApplication1.Data;
using WebApplication1.Services;

namespace WebApplication3
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
                });

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection")));

            // IMPORTANT: token creation and token validation use the SAME configured key.
            var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];
            if (string.IsNullOrWhiteSpace(jwtSecretKey))
            {
                throw new InvalidOperationException(
                    "Jwt:SecretKey is missing from configuration.");
            }

            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey));

            builder.Services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = signingKey,
                        ClockSkew = TimeSpan.Zero,
                        NameClaimType = ClaimTypes.Name,
                        RoleClaimType = ClaimTypes.Role
                    };
                });

            builder.Services.AddHttpClient();
            builder.Services.AddHostedService<CronJobService>();
            builder.Services.AddHostedService<AppointmentReminderService>();

            builder.Services.AddMemoryCache();
            builder.Services.AddSingleton<IEmailService, EmailService>();
            builder.Services.AddSingleton<OtpService>();

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Keep the project's previous development behavior so existing frontend URLs
            // are not unexpectedly blocked by CORS.
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
            });

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors("AllowAll");
            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.Run();
        }
    }
}
