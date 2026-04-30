using A365ShiftTracker.Infrastructure.Helpers;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace A365ShiftTracker.Infrastructure.Converters;

public class EncryptedStringConverter : ValueConverter<string?, string?>
{
    public EncryptedStringConverter(string key)
        : base(
            v => v == null ? null : EncryptionHelper.Encrypt(v, key),
            v => v == null ? null : EncryptionHelper.Decrypt(v, key))
    {
    }
}
