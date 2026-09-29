
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
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

//            // Add services to the container.
//            builder.Services.AddControllers()
//                .AddJsonOptions(options =>
//                {
//                    // Preserve property names as defined in the model
//                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
//                });


//            builder.Services.AddDbContext<ApplicationDbContext>(options =>
//                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));





//            // Configure JWT Authentication
//            var key = Encoding.ASCII.GetBytes("YourSuperSecretKeyHere");
//            builder.Services.AddAuthentication(options =>
//            {
//                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//            }).AddJwtBearer(options =>
//            {
//                options.TokenValidationParameters = new TokenValidationParameters
//                {
//                    ValidateIssuer = false,
//                    ValidateAudience = false,
//                    ValidateLifetime = true,
//                    ValidateIssuerSigningKey = true,
//                    IssuerSigningKey = new SymmetricSecurityKey(key),
//                    ClockSkew = TimeSpan.Zero
//                };
//            });
//            // Register Cron Job Service
//            builder.Services.AddHostedService<CronJobService>();
//            builder.Services.AddHttpClient();
//            builder.Services.AddHostedService<AppointmentReminderService>();

//            // Configure Swagger/OpenAPI
//            builder.Services.AddEndpointsApiExplorer();
//            builder.Services.AddSwaggerGen();

//            // Configure CORS
//            builder.Services.AddCors(options =>
//            {
//                options.AddPolicy("AllowAll",
//                    policyBuilder => policyBuilder.AllowAnyOrigin()
//                                                  .AllowAnyMethod()
//                                                  .AllowAnyHeader());
//            });

//            var app = builder.Build();

//            // Configure the HTTP request pipeline.
//            if (app.Environment.IsDevelopment())
//            {
//                app.UseSwagger();
//                app.UseSwaggerUI();
//            }







//            app.UseCors("AllowAll");
//            app.UseHttpsRedirection();
//            app.UseAuthentication(); // Add this line
//            app.UseAuthorization();

//            app.MapControllers();

//            app.Run();
//        }
//    }
//}


//Before funtion of "Sending messages through sms gateway in dockyard"
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.IdentityModel.Tokens;
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

//            // Add services to the container.
//            builder.Services.AddControllers()
//                .AddJsonOptions(options =>
//                {
//                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
//                });

//            // Database Context
//            builder.Services.AddDbContext<ApplicationDbContext>(options =>
//                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

//            // JWT Authentication
//            var key = Encoding.ASCII.GetBytes("YourSuperSecretKeyHere");
//            builder.Services.AddAuthentication(options =>
//            {
//                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//            }).AddJwtBearer(options =>
//            {
//                options.TokenValidationParameters = new TokenValidationParameters
//                {
//                    ValidateIssuer = false,
//                    ValidateAudience = false,
//                    ValidateLifetime = true,
//                    ValidateIssuerSigningKey = true,
//                    IssuerSigningKey = new SymmetricSecurityKey(key),
//                    ClockSkew = TimeSpan.Zero
//                };
//            });

//            // HttpClient and Background Services
//            builder.Services.AddHttpClient();
//            builder.Services.AddHostedService<CronJobService>();
//            builder.Services.AddHostedService<AppointmentReminderService>();

//            // Swagger/OpenAPI
//            builder.Services.AddEndpointsApiExplorer();
//            builder.Services.AddSwaggerGen();

//            // CORS
//            builder.Services.AddCors(options =>
//            {
//                options.AddPolicy("AllowAll",
//                    policyBuilder => policyBuilder.AllowAnyOrigin()
//                                                  .AllowAnyMethod()
//                                                  .AllowAnyHeader());
//            });

//            var app = builder.Build();

//            // Configure the HTTP request pipeline.
//            if (app.Environment.IsDevelopment())
//            {
//                app.UseSwagger();
//                app.UseSwaggerUI();
//            }

//            app.UseCors("AllowAll");
//            app.UseHttpsRedirection();
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

            // Add services to the container.
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = null;
                });

            // Database Context
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // JWT Authentication
            // NOTE (fixed): this used to be a hardcoded literal ("YourSuperSecretKeyHere") that was
            // DIFFERENT from the key LoginController used to sign tokens (Jwt:SecretKey in
            // appsettings.json). That mismatch meant the bearer-auth middleware could never
            // successfully validate a token this API itself issued. Both sides now read the same
            // value from configuration.
            var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];
            var key = Encoding.ASCII.GetBytes(jwtSecretKey!);
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                };
            });

            // HttpClient and Background Services
            builder.Services.AddHttpClient();
            builder.Services.AddHostedService<CronJobService>();
            builder.Services.AddHostedService<AppointmentReminderService>();

            // In-memory cache backing the OTP service (patient login OTP + staff password-reset OTP)
            builder.Services.AddMemoryCache();
            builder.Services.AddSingleton<IEmailService, EmailService>();
            builder.Services.AddSingleton<OtpService>();

            // Swagger/OpenAPI
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policyBuilder => policyBuilder.AllowAnyOrigin()
                                                  .AllowAnyMethod()
                                                  .AllowAnyHeader());
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
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