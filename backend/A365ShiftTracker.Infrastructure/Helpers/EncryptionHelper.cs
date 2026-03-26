using System.Security.Cryptography;
using System.Text;

namespace A365ShiftTracker.Infrastructure.Helpers;

public static class EncryptionHelper
{
    public static string Encrypt(string plainText, string key)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;
        using var aes = Aes.Create();
        aes.Key = GetKey(key);
        aes.GenerateIV();
        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        var result = new byte[aes.IV.Length + cipherBytes.Length];
        Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
        Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);
        return Convert.ToBase64String(result);
    }

    public static string Decrypt(string cipherText, string key)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;
        try
        {
            var fullCipher = Convert.FromBase64String(cipherText);
            using var aes = Aes.Create();
            aes.Key = GetKey(key);
            var iv = new byte[aes.BlockSize / 8];
            var cipher = new byte[fullCipher.Length - iv.Length];
            Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
            Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);
            aes.IV = iv;
            using var decryptor = aes.CreateDecryptor();
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
            return Encoding.UTF8.GetString(plainBytes);
        }
        catch
        {
            // If decryption fails (e.g., plaintext data), return as-is
            return cipherText;
        }
    }

    private static byte[] GetKey(string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var result = new byte[32]; // AES-256
        Buffer.BlockCopy(keyBytes, 0, result, 0, Math.Min(keyBytes.Length, 32));
        return result;
    }
}
