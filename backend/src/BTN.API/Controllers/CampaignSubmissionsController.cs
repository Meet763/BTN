using BTN.Business.Campaign;
using BTN.Core.DTOs.Campaign;
using BTN.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTN.API.Controllers;

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/campaign-submissions")]
public class CampaignSubmissionsController : ControllerBase
{
    private readonly ICampaignSubmissionManager _manager;

    public CampaignSubmissionsController(ICampaignSubmissionManager manager)
    {
        _manager = manager;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? platform = null,
        [FromQuery] string? search = null,
        [FromQuery] GiftStatus? giftStatus = null,
        [FromQuery] string? jobRole = null)
    {
        var result = await _manager.GetSubmissionsAsync(page, pageSize, platform, search, giftStatus, jobRole);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var row = await _manager.GetByIdAsync(id);
        return row == null ? NotFound(new { success = false, error = "Submission not found." }) : Ok(new { success = true, data = row });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateGiftStatusRequest request)
    {
        try
        {
            var row = await _manager.UpdateStatusAsync(id, request.GiftStatus);
            return Ok(new { success = true, data = row });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { success = false, error = ex.Message });
        }
    }
}
