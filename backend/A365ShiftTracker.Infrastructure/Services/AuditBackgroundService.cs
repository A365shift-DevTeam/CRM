using System.Threading.Channels;
using A365ShiftTracker.Domain.Entities;
using A365ShiftTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace A365ShiftTracker.Infrastructure.Services;

public sealed class AuditBackgroundService : BackgroundService
{
    private readonly ChannelReader<IReadOnlyList<AuditLog>> _reader;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditBackgroundService> _logger;

    public AuditBackgroundService(
        ChannelReader<IReadOnlyList<AuditLog>> reader,
        IServiceScopeFactory scopeFactory,
        ILogger<AuditBackgroundService> logger)
    {
        _reader = reader;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var batch in _reader.ReadAllAsync(stoppingToken))
        {
            if (batch.Count == 0) continue;
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.AuditLogs.AddRange(batch);
                await db.SaveChangesWithoutAuditAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to persist {Count} audit log entries.", batch.Count);
            }
        }
    }
}
