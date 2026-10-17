using System.Collections.Concurrent;
using BTN.Business.Campaign;
using BTN.Core.DTOs.Leads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTN.API.Controllers;

[AllowAnonymous]
[Route("api/public/campaign")]
public class PublicCampaignController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, Queue<DateTime>> Submissions = new();
    private readonly ICampaignSubmissionManager _campaignSubmissionManager;
    private readonly ICampaignFormAppearanceManager _appearanceManager;

    public PublicCampaignController(
        ICampaignSubmissionManager campaignSubmissionManager,
        ICampaignFormAppearanceManager appearanceManager)
    {
        _campaignSubmissionManager = campaignSubmissionManager;
        _appearanceManager = appearanceManager;
    }

    [HttpGet("appearance")]
    public async Task<IActionResult> GetAppearance()
    {
        var data = await _appearanceManager.GetAsync();
        return Ok(new { success = true, data });
    }

    [HttpPost("leads")]
    public async Task<IActionResult> SubmitLead([FromBody] CampaignLeadRequest? request)
    {
        if (request is null)
        {
            return BadRequest(new { success = false, error = "Please complete the form and try again." });
        }

        if (!string.IsNullOrWhiteSpace(request.Website))
        {
            return Ok(new { success = true });
        }

        if (!ModelState.IsValid)
        {
            var error = ModelState.Values.SelectMany(v => v.Errors).FirstOrDefault()?.ErrorMessage
                ?? "Please check the form and try again.";
            return BadRequest(new { success = false, error });
        }

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        if (IsRateLimited(ip))
        {
            return StatusCode(429, new { success = false, error = "Too many submissions. Please wait a minute and try again." });
        }

        try
        {
            var id = await _campaignSubmissionManager.SubmitAsync(request);
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

            if (queue.Count >= 8)
            {
                return true;
            }

            queue.Enqueue(now);
            return false;
        }
    }
}
