using System.Collections.Concurrent;

namespace A365ShiftTracker.API.Logging;

public sealed class FileLoggerProvider : ILoggerProvider
{
    private readonly string _logDirectory;
    private readonly ConcurrentDictionary<string, FileLogger> _loggers = new();

    public FileLoggerProvider(string logDirectory)
    {
        _logDirectory = logDirectory;
        Directory.CreateDirectory(logDirectory);
    }

    public ILogger CreateLogger(string categoryName)
        => _loggers.GetOrAdd(categoryName, name => new FileLogger(name, _logDirectory));

    public void Dispose()
    {
        _loggers.Clear();
    }
}

internal sealed class FileLogger : ILogger
{
    private readonly string _categoryName;
    private readonly string _logDirectory;
    private static readonly object _lock = new();

    public FileLogger(string categoryName, string logDirectory)
    {
        _categoryName = categoryName;
        _logDirectory = logDirectory;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) =>
        logLevel is LogLevel.Error or LogLevel.Critical;

    public void Log<TState>(
        LogLevel logLevel,
        EventId eventId,
        TState state,
        Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;

        var timestamp = DateTime.Now;
        var fileName = $"error-{timestamp:yyyy-MM-dd}.log";
        var filePath = Path.Combine(_logDirectory, fileName);

        var message = formatter(state, exception);
        var exceptionDetails = exception is not null
            ? $"\r\nException: {exception.GetType().Name}: {exception.Message}\r\nStackTrace: {exception.StackTrace}"
            : string.Empty;

        var logLine = $"[{timestamp:yyyy-MM-dd HH:mm:ss}] [{logLevel}] [{_categoryName}]\r\n{message}{exceptionDetails}\r\n{new string('-', 80)}\r\n";

        lock (_lock)
        {
            File.AppendAllText(filePath, logLine);
        }
    }
}
