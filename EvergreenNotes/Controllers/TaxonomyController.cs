using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api/taxonomy/tags")]
    [ApiController]
    [Authorize]
    public class TaxonomyController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TaxonomyController(ITagService tagService)
        {
            _tagService = tagService;
        }

        [HttpGet("tree")]
        public async Task<IActionResult> GetTree()
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.GetTagTreeAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] Guid? parentTagId = null, [FromQuery] int limit = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.SearchTagsAsync(userId, q, parentTagId, limit);
                return Ok(new { items = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaxonomyTagRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.CreateTagAsync(userId, request.Name, request.ParentTagId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                throw new UnauthorizedAccessException("User not authenticated");

            return Guid.Parse(userId);
        }
    }
}
