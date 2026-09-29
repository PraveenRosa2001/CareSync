using Microsoft.Extensions.Caching.Memory;
using System;
using System.Security.Cryptography;

namespace WebApplication1.Services
{
    /// <summary>
    /// Generates, stores and verifies one-time-passcodes (OTPs) entirely server-side.
    /// Storage is an in-memory cache keyed by (purpose + identifier), so no database
    /// migration is required. "purpose" keeps the different OTP flows (patient login,
    /// staff password reset, ...) from being able to consume each other's codes.
    ///
    /// NOTE: because this uses IMemoryCache, OTP state is per-instance. That's fine for
    /// a single backend process (the normal case for this project). If this API is ever
    /// scaled out behind a load balancer with multiple instances, swap the cache calls
    /// below for a shared store (e.g. Redis) so all instances see the same OTP state.
    /// </summary>
    public class OtpService
    {
        private readonly IMemoryCache _cache;

        private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(45);
        private static readonly TimeSpan VerifiedTicketLifetime = TimeSpan.FromMinutes(10);
        private const int MaxAttempts = 5;

        public OtpService(IMemoryCache cache)
        {
            _cache = cache;
        }

        /// <summary>
        /// Returns false (with a suggested wait time) if an OTP was already sent for this
        /// purpose/identifier too recently. Call this before generating+emailing a new OTP
        /// to stop someone from spamming the mailbox / mail server with repeated requests.
        /// </summary>
        public bool CanRequestOtp(string purpose, string identifier, out TimeSpan retryAfter)
        {
            var cooldownKey = CooldownKey(purpose, identifier);
            if (_cache.TryGetValue<DateTime>(cooldownKey, out var nextAllowedUtc) && nextAllowedUtc > DateTime.UtcNow)
            {
                retryAfter = nextAllowedUtc - DateTime.UtcNow;
                return false;
            }

            retryAfter = TimeSpan.Zero;
            return true;
        }

        /// <summary>Generates a new 6-digit OTP, stores it, and starts the resend cooldown.</summary>
        public string GenerateOtp(string purpose, string identifier)
        {
            // Cryptographically random, not System.Random - this is a security code.
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

            _cache.Set(OtpKey(purpose, identifier), new OtpEntry(code, DateTime.UtcNow.Add(OtpLifetime)), OtpLifetime);
            _cache.Set(CooldownKey(purpose, identifier), DateTime.UtcNow.Add(ResendCooldown), ResendCooldown);

            return code;
        }

        /// <summary>
        /// Verifies a submitted code against the stored OTP. On success, the OTP is
        /// consumed (cannot be reused) and a short-lived "verified" ticket is stamped for
        /// this purpose/identifier so a later step (e.g. actually logging in, or actually
        /// changing the password) can confirm the OTP step really happened.
        /// </summary>
        public (bool Success, string? Error) VerifyOtp(string purpose, string identifier, string? submittedCode)
        {
            if (string.IsNullOrWhiteSpace(submittedCode))
            {
                return (false, "Please enter the code we emailed you.");
            }

            var key = OtpKey(purpose, identifier);
            if (!_cache.TryGetValue<OtpEntry>(key, out var entry) || entry == null)
            {
                return (false, "That code has expired or was never requested. Please request a new one.");
            }

            if (entry.Attempts >= MaxAttempts)
            {
                _cache.Remove(key);
                return (false, "Too many incorrect attempts. Please request a new code.");
            }

            if (!string.Equals(entry.Code, submittedCode.Trim(), StringComparison.Ordinal))
            {
                entry.Attempts++;
                var remaining = entry.ExpiresAtUtc - DateTime.UtcNow;
                if (remaining > TimeSpan.Zero)
                {
                    _cache.Set(key, entry, remaining);
                }
                else
                {
                    _cache.Remove(key);
                }
                return (false, "Incorrect code. Please try again.");
            }

            // Correct: consume the OTP so it can't be replayed, and issue a verified ticket.
            _cache.Remove(key);
            _cache.Set(VerifiedKey(purpose, identifier), true, VerifiedTicketLifetime);
            return (true, null);
        }

        /// <summary>Checks whether this purpose/identifier currently has a valid "verified" ticket, without spending it.</summary>
        public bool IsVerified(string purpose, string identifier)
        {
            return _cache.TryGetValue<bool>(VerifiedKey(purpose, identifier), out var verified) && verified;
        }

        /// <summary>Checks whether this purpose/identifier currently has a valid "verified" ticket, and spends it (single use). Use this on the final, sensitive action (login / password change).</summary>
        public bool ConsumeVerification(string purpose, string identifier)
        {
            var key = VerifiedKey(purpose, identifier);
            if (_cache.TryGetValue<bool>(key, out var verified) && verified)
            {
                _cache.Remove(key);
                return true;
            }
            return false;
        }

        private static string OtpKey(string purpose, string identifier) => $"otp:{purpose}:{identifier}";
        private static string CooldownKey(string purpose, string identifier) => $"otp-cooldown:{purpose}:{identifier}";
        private static string VerifiedKey(string purpose, string identifier) => $"otp-verified:{purpose}:{identifier}";

        private class OtpEntry
        {
            public string Code { get; }
            public DateTime ExpiresAtUtc { get; }
            public int Attempts { get; set; }

            public OtpEntry(string code, DateTime expiresAtUtc)
            {
                Code = code;
                ExpiresAtUtc = expiresAtUtc;
                Attempts = 0;
            }
        }
    }
}