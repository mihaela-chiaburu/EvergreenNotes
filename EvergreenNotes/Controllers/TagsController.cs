using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api")]
    [ApiController]
    [Authorize]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagsController(ITagService tagService)
        {
            _tagService = tagService;
        }

        // POST /api/tags - Create tag
        [HttpPost("tags")]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.CreateTagAsync(userId, request.Name);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/tags - Get all tags
        [HttpGet("tags")]
        public async Task<IActionResult> GetAllTags()
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.GetAllTagsAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST /api/notes/{noteId}/tags - Add tag to note
        [HttpPost("notes/{noteId}/tags")]
        public async Task<IActionResult> AddTagToNote(Guid noteId, [FromBody] AddTagToNoteRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _tagService.AddTagToNoteAsync(userId, noteId, request.TagId);
                return Ok(new { message = "Tag added to note successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE /api/notes/{noteId}/tags/{tagId} - Remove tag from note
        [HttpDelete("notes/{noteId}/tags/{tagId}")]
        public async Task<IActionResult> RemoveTagFromNote(Guid noteId, Guid tagId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _tagService.RemoveTagFromNoteAsync(userId, noteId, tagId);
                return Ok(new { message = "Tag removed from note successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/tags/{tagId}/notes - Get notes by tag
        [HttpGet("tags/{tagId}/notes")]
        public async Task<IActionResult> GetNotesByTag(Guid tagId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.GetNotesByTagAsync(userId, tagId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Helper method
        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                throw new UnauthorizedAccessException("User not authenticated");

            return Guid.Parse(userId);
        }
    }
}