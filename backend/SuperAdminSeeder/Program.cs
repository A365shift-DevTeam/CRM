using System;
using System.Threading.Tasks;
using Npgsql;

namespace SuperAdminSeeder;

class Program
{
    const string ConnStr = "User ID=postgres;Password=postgres;Server=localhost;Port=5432;Database=a365shift_tracker;Include Error Detail=true;";
    const string Email    = "superadmin@platform.com";
    const string Password = "SuperAdmin@123!";

    static async Task Main()
    {
        Console.WriteLine("A365 CRM — Super Admin Seeder");
        Console.WriteLine("==============================");

        var hash = global::BCrypt.Net.BCrypt.HashPassword(Password, workFactor: 11);
        Console.WriteLine("Generated BCrypt hash.");

        await using var conn = new NpgsqlConnection(ConnStr);
        await conn.OpenAsync();
        Console.WriteLine("Connected to database.");

        // Check if SUPER_ADMIN user already exists
        await using var check = new NpgsqlCommand(
            "SELECT id, email FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1", conn);
        await using var reader = await check.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            var existingId    = reader.GetInt32(0);
            var existingEmail = reader.GetString(1);
            await reader.CloseAsync();

            Console.WriteLine($"Found existing SUPER_ADMIN (id={existingId}, email={existingEmail}).");
            Console.WriteLine("Updating credentials...");

            await using var update = new NpgsqlCommand(@"
                UPDATE users SET
                    email          = @email,
                    password_hash  = @hash,
                    display_name   = 'Super Admin',
                    is_first_login = false,
                    is_active      = true,
                    role           = 'SUPER_ADMIN',
                    org_id         = NULL
                WHERE id = @id", conn);

            update.Parameters.AddWithValue("@email", Email);
            update.Parameters.AddWithValue("@hash",  hash);
            update.Parameters.AddWithValue("@id",    existingId);
            await update.ExecuteNonQueryAsync();

            Console.WriteLine($"Updated SUPER_ADMIN user (id={existingId}).");
        }
        else
        {
            await reader.CloseAsync();
            Console.WriteLine("No SUPER_ADMIN found. Creating new user...");

            await using var insert = new NpgsqlCommand(@"
                INSERT INTO users
                    (email, password_hash, display_name, role, is_active, is_first_login,
                     is_totp_enabled, two_factor_required, two_factor_method, created_at)
                VALUES
                    (@email, @hash, 'Super Admin', 'SUPER_ADMIN', true, false,
                     false, false, 'email', NOW())", conn);

            insert.Parameters.AddWithValue("@email", Email);
            insert.Parameters.AddWithValue("@hash",  hash);
            await insert.ExecuteNonQueryAsync();

            Console.WriteLine("Created new SUPER_ADMIN user.");
        }

        Console.WriteLine();
        Console.WriteLine("Done! Login with:");
        Console.WriteLine($"  Email:    {Email}");
        Console.WriteLine($"  Password: {Password}");
    }
}
