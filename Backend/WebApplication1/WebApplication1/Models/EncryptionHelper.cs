using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

public static class EncryptionHelper
{
    private static readonly string Key = "Your32CharLongEncryptionKey123456789012"; // 32 chars for AES-256
    private static readonly string IV = "Your16CharLongIV"; // 16 chars

    public static string Encrypt(string plainText)
    {
        using Aes aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(Key);
        aes.IV = Encoding.UTF8.GetBytes(IV);

        using MemoryStream memoryStream = new();
        using CryptoStream cryptoStream = new(memoryStream, aes.CreateEncryptor(), CryptoStreamMode.Write);
        using StreamWriter writer = new(cryptoStream);
        writer.Write(plainText);

        return Convert.ToBase64String(memoryStream.ToArray());
    }

    public static string Decrypt(string encryptedText)
    {
        using Aes aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(Key);
        aes.IV = Encoding.UTF8.GetBytes(IV);

        using MemoryStream memoryStream = new(Convert.FromBase64String(encryptedText));
        using CryptoStream cryptoStream = new(memoryStream, aes.CreateDecryptor(), CryptoStreamMode.Read);
        using StreamReader reader = new(cryptoStream);

        return reader.ReadToEnd();
    }
}
