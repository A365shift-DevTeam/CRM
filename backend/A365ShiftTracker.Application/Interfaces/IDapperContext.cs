using System.Data;

namespace A365ShiftTracker.Application.Interfaces;

public interface IDapperContext
{
    IDbConnection CreateConnection();
}
