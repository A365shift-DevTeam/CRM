namespace A365ShiftTracker.Application.DTOs;

public class MonthlyRevenueDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
}

public class CategoryExpenseDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}

public class PipelineConversionDto
{
    public List<StageCountDto> Stages { get; set; } = new();
}

public class StageCountDto
{
    public string Stage { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ContactGrowthDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public int NewContacts { get; set; }
    public int TotalContacts { get; set; }
}

public class BulkDeleteRequest
{
    public List<int> Ids { get; set; } = new();
}

public class BulkStatusRequest
{
    public List<int> Ids { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

public class ImportResultDto
{
    public int Imported { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = new();
}

