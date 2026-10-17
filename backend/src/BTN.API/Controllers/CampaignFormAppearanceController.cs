using BTN.Business.Campaign;
using BTN.Core.DTOs.Campaign;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTN.API.Controllers;

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/campaign-form-appearance")]
public class CampaignFormAppearanceController : ControllerBase
{
    private readonly ICampaignFormAppearanceManager _manager;

    public CampaignFormAppearanceController(ICampaignFormAppearanceManager manager)
    {
        _manager = manager;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var data = await _manager.GetAsync();
        return Ok(new { success = true, data });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateCampaignFormAppearanceRequest? request)
    {
        if (request is null)
        {
            return BadRequest(new { success = false, error = "Choose a theme to save." });
        }

        try
        {
            var data = await _manager.UpdateAsync(request);
            return Ok(new { success = true, data });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }
}
