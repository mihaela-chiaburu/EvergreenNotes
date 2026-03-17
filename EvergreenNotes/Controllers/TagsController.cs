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

        [HttpPost("tags")]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _tagService.CreateTagAsync(userId, request.Name, null);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("notes/{noteId}/tags")]
        public async Task<IActionResult> ReplaceNoteTags(Guid noteId, [FromBody] ReplaceNoteTagsRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _tagService.ReplaceNoteTagsAsync(userId, noteId, request.TagNames);
                return Ok(new { message = "Note tags updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

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

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                throw new UnauthorizedAccessException("User not authenticated");

            return Guid.Parse(userId);
        }
    }
}