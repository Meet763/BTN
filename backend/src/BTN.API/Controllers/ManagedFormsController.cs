using BTN.Business.Forms;
using BTN.Core.DTOs.Forms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTN.API.Controllers;

[Authorize(Roles = "PlatformOwner")]
[ApiController]
[Route("api/forms")]
public class ManagedFormsController : ControllerBase
{
    private readonly IManagedFormManager _manager;
    private readonly IWebHostEnvironment _environment;

    public ManagedFormsController(IManagedFormManager manager, IWebHostEnvironment environment)
    {
        _manager = manager;
        _environment = environment;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var data = await _manager.ListAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var data = await _manager.GetAsync(id);
        if (data == null) return NotFound(new { success = false, error = "Form not found." });
        return Ok(new { success = true, data });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveManagedFormRequest? request)
    {
        if (request is null) return BadRequest(new { success = false, error = "Add a name for the form." });
        try
        {
            var data = await _manager.CreateAsync(request);
            return Ok(new { success = true, data });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveManagedFormRequest? request)
    {
        if (request is null) return BadRequest(new { success = false, error = "Nothing to save." });
        try
        {
            var data = await _manager.UpdateAsync(id, request);
            return Ok(new { success = true, data });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _manager.DeleteAsync(id);
            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/submissions")]
    public async Task<IActionResult> Submissions(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var (items, total) = await _manager.ListSubmissionsAsync(id, page, pageSize);
            return Ok(new { success = true, data = new { items, total } });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { success = false, error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/submissions/{submissionId:guid}/files/{fieldKey}")]
    public async Task<IActionResult> Download(Guid id, Guid submissionId, string fieldKey)
    {
        var opened = await _manager.OpenFileAsync(id, submissionId, fieldKey);
        if (opened == null) return NotFound(new { success = false, error = "File not found." });
        var (submission, storedName, downloadName) = opened.Value;
        var path = Path.Combine(_environment.ContentRootPath, "form-uploads", submission.Id.ToString("N"), storedName);
        if (!System.IO.File.Exists(path)) return NotFound(new { success = false, error = "File not found." });
        var stream = System.IO.File.OpenRead(path);
        return File(stream, "application/octet-stream", downloadName);
    }
}
