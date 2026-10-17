using System.Collections.Concurrent;
using System.Text.Json;
using BTN.Business.Forms;
using BTN.Core.DTOs.Forms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTN.API.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/public/forms")]
public class PublicFormsController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, Queue<DateTime>> Submissions = new();
    private readonly IManagedFormManager _manager;
    private readonly IWebHostEnvironment _environment;

    public PublicFormsController(IManagedFormManager manager, IWebHostEnvironment environment)
    {
        _manager = manager;
        _environment = environment;
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug)
    {
        var data = await _manager.GetPublishedAsync(slug);
        if (data == null) return NotFound(new { success = false, error = "This form is not available." });
        return Ok(new { success = true, data });
    }

    [HttpPost("{slug}")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Submit(string slug)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (IsRateLimited(ip))
        {
            return StatusCode(429, new { success = false, error = "Too many submissions. Please wait a minute and try again." });
        }

        var answers = new Dictionary<string, string?>(StringComparer.Ordinal);
        if (Request.HasFormContentType)
        {
            var raw = Request.Form["answers"].ToString();
            if (!string.IsNullOrWhiteSpace(raw))
            {
                try
                {
                    answers = JsonSerializer.Deserialize<Dictionary<string, string?>>(raw) ?? answers;
                }
                catch
                {
                    return BadRequest(new { success = false, error = "Please check the form and try again." });
                }
            }
        }

        var files = Request.HasFormContentType
            ? Request.Form.Files.Select(file => new IncomingFormFile
            {
                FieldKey = file.Name,
                FileName = file.FileName,
                Length = file.Length,
                Content = file.OpenReadStream()
            }).ToList()
            : [];

        var website = Request.HasFormContentType ? Request.Form["website"].ToString() : null;

        try
        {
            var id = await _manager.SubmitAsync(slug, answers, files, _environment.ContentRootPath, website);
            return Ok(new { success = true, data = new { id } });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    private static bool IsRateLimited(string ip)
    {
        var now = DateTime.UtcNow;
        var queue = Submissions.GetOrAdd(ip, _ => new Queue<DateTime>());
        lock (queue)
        {
            while (queue.Count > 0 && now - queue.Peek() > TimeSpan.FromMinutes(2))
            {
                queue.Dequeue();
            }

            if (queue.Count >= 8) return true;
            queue.Enqueue(now);
            return false;
        }
    }
}
