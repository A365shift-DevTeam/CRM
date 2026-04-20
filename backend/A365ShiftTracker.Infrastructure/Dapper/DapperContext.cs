using System.Data;
using A365ShiftTracker.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace A365ShiftTracker.Infrastructure.Dapper;

public class DapperContext : IDapperContext
{
    private readonly string _connectionString;

    public DapperContext(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection is not configured.");

        // Map snake_case DB columns to PascalCase C# properties automatically
        global::Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;
    }

    public IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);
}
