using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace A365ShiftTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp",
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
        ".zip", ".rar", ".7z"
    };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    private static readonly HashSet<string> AllowedFolders = new(StringComparer.OrdinalIgnoreCase)
    {
        "general", "documents", "invoices", "contacts", "projects", "avatars", "receipts", "legal"
    };

    public UploadController(IWebHostEnvironment env) => _env = env;

    [HttpPost]
    [RequestSizeLimit(10_485_760)] // 10MB
    public async Task<IActionResult> Upload(IFormFile file, [FromForm] string? folder)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { error = "File size exceeds 10MB limit." });

        var ext = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { error = $"File type '{ext}' is not allowed." });

        // Whitelist folder names — prevents path traversal via crafted folder parameter
        var subFolder = (!string.IsNullOrWhiteSpace(folder) && AllowedFolders.Contains(folder))
            ? folder
            : "general";

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads"));
        var uploadsDir  = Path.GetFullPath(Path.Combine(uploadsRoot, subFolder));

        // Defense-in-depth: verify resolved path stays within uploads root
        if (!uploadsDir.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Invalid folder." });

        Directory.CreateDirectory(uploadsDir);

        var uniqueName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, uniqueName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"/uploads/{subFolder}/{uniqueName}";

        return Ok(new
        {
            url = fileUrl,
            fileName = file.FileName,
            fileType = file.ContentType,
            fileSize = file.Length
        });
    }

    [HttpDelete]
    public IActionResult Delete([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
            return BadRequest(new { error = "No URL provided." });

        // Only allow deleting files from our uploads directory
        if (!url.StartsWith("/uploads/"))
            return BadRequest(new { error = "Invalid file URL." });

        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var filePath = Path.Combine(webRoot, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
            return Ok(new { success = true });
        }

        return NotFound(new { error = "File not found." });
    }
}
