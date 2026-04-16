using System.Linq.Expressions;
using A365ShiftTracker.Infrastructure.Helpers;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace A365ShiftTracker.Infrastructure.Converters;

/// <summary>
/// EF Core value converter for non-nullable decimal fields stored as encrypted text.
/// Gracefully falls back to 0 when decryption yields non-numeric data (e.g. old plain values).
/// </summary>
public class EncryptedDecimalConverter : ValueConverter<decimal, string>
{
    public EncryptedDecimalConverter(string key)
        : base(
            v => EncryptionHelper.Encrypt(v.ToString("G"), key),
            v => DecryptDecimal(v, key))
    {
    }

    private static decimal DecryptDecimal(string v, string key)
    {
        var plain = EncryptionHelper.Decrypt(v, key);
        return decimal.TryParse(plain, out var result) ? result : 0m;
    }
}

/// <summary>
/// EF Core value converter for nullable decimal fields stored as encrypted text.
/// </summary>
public class EncryptedNullableDecimalConverter : ValueConverter<decimal?, string?>
{
    public EncryptedNullableDecimalConverter(string key)
        : base(
            v => v == null ? null : EncryptionHelper.Encrypt(v.Value.ToString("G"), key),
            v => DecryptNullableDecimal(v, key))
    {
    }

    private static decimal? DecryptNullableDecimal(string? v, string key)
    {
        if (v == null) return null;
        var plain = EncryptionHelper.Decrypt(v, key);
        return decimal.TryParse(plain, out var result) ? result : (decimal?)null;
    }
}
