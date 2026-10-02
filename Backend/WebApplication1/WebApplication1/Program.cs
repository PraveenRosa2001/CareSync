//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
//using System.Security.Claims;
//using System.Text;
//using WebApplication1.Data;
//using WebApplication1.Services;

//namespace WebApplication3
//{
//    public class Program
//    {
//        public static void Main(string[] args)
//        {
//            var builder = WebApplication.CreateBuilder(args);

//            builder.Services.AddControllers()
//                .AddJsonOptions(options =>
//                {
//                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
//                });

//            builder.Services.AddDbContext<ApplicationDbContext>(options =>
//                options.UseSqlServer(
//                    builder.Configuration.GetConnectionString("DefaultConnection")));

//            // LoginController already signs tokens with Jwt:SecretKey.
//            // Validation MUST use the same key, otherwise every protected request returns 401.
//            var jwtSecret = builder.Configuration["Jwt:SecretKey"];
//            if (string.IsNullOrWhiteSpace(jwtSecret))
//            {
//                throw new InvalidOperationException(
//                    "Jwt:SecretKey is missing from configuration.");
//            }

//            var signingKey = new SymmetricSecurityKey(
//                Encoding.UTF8.GetBytes(jwtSecret));

//            builder.Services
//                .AddAuthentication(options =>
//                {
//                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//                })
//                .AddJwtBearer(options =>
//                {
//                    options.TokenValidationParameters = new TokenValidationParameters
//                    {
//                        ValidateIssuer = false,
//                        ValidateAudience = false,
//                        ValidateLifetime = true,
//                        ValidateIssuerSigningKey = true,
//                        IssuerSigningKey = signingKey,
//                        NameClaimType = ClaimTypes.Name,
//                        RoleClaimType = ClaimTypes.Role,
//                        ClockSkew = TimeSpan.FromSeconds(30)
//                    };
//                });

//            builder.Services.Configure<EmailSettings>(
//                builder.Configuration.GetSection("EmailSettings"));
//            builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

//            builder.Services.AddHttpClient();

//            // CronJobService now ONLY retires expired slots; it never creates new ones.
//            builder.Services.AddHostedService<CronJobService>();

//            // Sends doctor and patient EMAIL reminders one day before the scheduled date.
//            builder.Services.AddHostedService<AppointmentReminderService>();

//            builder.Services.AddEndpointsApiExplorer();
//            builder.Services.AddSwaggerGen();

//            builder.Services.AddCors(options =>
//            {
//                options.AddPolicy("AllowAll", policy =>
//                    policy.AllowAnyOrigin()
//                          .AllowAnyMethod()
//                          .AllowAnyHeader());
//            });

//            var app = builder.Build();

//            if (app.Environment.IsDevelopment())
//            {
//                app.UseSwagger();
//                app.UseSwaggerUI();
//            }

//            app.UseCors("AllowAll");
//            app.UseHttpsRedirection();

//            // Authentication must be before Authorization.
//            app.UseAuthentication();
//            app.UseAuthorization();

//            app.MapControllers();
//            app.Run();
//        }
//    }
//}


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

            // LoginController already signs tokens with Jwt:SecretKey.
            // Validation MUST use the same key, otherwise every protected request returns 401.
            var jwtSecret = builder.Configuration["Jwt:SecretKey"];
            if (string.IsNullOrWhiteSpace(jwtSecret))
            {
                throw new InvalidOperationException(
                    "Jwt:SecretKey is missing from configuration.");
            }

            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret));

            builder.Services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = signingKey,
                        NameClaimType = ClaimTypes.Name,
                        RoleClaimType = ClaimTypes.Role,
                        ClockSkew = TimeSpan.FromSeconds(30)
                    };
                });

            builder.Services.Configure<EmailSettings>(
                builder.Configuration.GetSection("EmailSettings"));
            builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

            builder.Services.AddMemoryCache();
            builder.Services.AddHttpClient();

            // CronJobService now ONLY retires expired slots; it never creates new ones.
            builder.Services.AddHostedService<CronJobService>();

            // Sends doctor and patient EMAIL reminders one day before the scheduled date.
            builder.Services.AddHostedService<AppointmentReminderService>();

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

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

            // Authentication must be before Authorization.
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.Run();
        }
    }
}
