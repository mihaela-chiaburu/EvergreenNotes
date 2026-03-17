using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotesController : ControllerBase
    {
        private readonly INoteService _noteService;

        public NotesController(INoteService noteService)
        {
            _noteService = noteService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateNote([FromBody] CreateNoteRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _noteService.CreateNoteAsync(userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{noteId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetNoteById(Guid noteId)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _noteService.GetNoteByIdAsync(noteId, currentUserId);

                if (result == null)
                    return NotFound(new { error = "Note not found or access denied" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{noteId}")]
        public async Task<IActionResult> UpdateNote(Guid noteId, [FromBody] UpdateNoteRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _noteService.UpdateNoteAsync(noteId, userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{noteId}")]
        public async Task<IActionResult> DeleteNote(Guid noteId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _noteService.DeleteNoteAsync(noteId, userId);
                return Ok(new { message = "Note deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetNotes(
            [FromQuery] int? status,
            [FromQuery] int? visibility,
            [FromQuery] int? plantState,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetCurrentUserId();

                var request = new GetNotesRequest
                {
                    Status = status.HasValue ? (NoteStatus)status.Value : null,
                    Visibility = visibility.HasValue ? (NoteVisibility)visibility.Value : null,
                    PlantState = plantState.HasValue ? (PlantState)plantState.Value : null,
                    Search = search,
                    Page = page,
                    PageSize = pageSize
                };

                var result = await _noteService.GetNotesAsync(userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("users/{userId}/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicNotesByUser(
            Guid userId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 100)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _noteService.GetPublicNotesByUserIdAsync(userId, currentUserId, page, pageSize);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{noteId}/water")]
        public async Task<IActionResult> WaterNote(Guid noteId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _noteService.WaterNoteAsync(noteId, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{noteId}/status")]
        public async Task<IActionResult> UpdateNoteStatus(Guid noteId, [FromBody] UpdateStatusRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _noteService.UpdateNoteStatusAsync(noteId, userId, request.Status);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{noteId}/visibility")]
        public async Task<IActionResult> UpdateNoteVisibility(Guid noteId, [FromBody] UpdateVisibilityRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _noteService.UpdateNoteVisibilityAsync(noteId, userId, request.Visibility);
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

        private Guid? GetCurrentUserIdOrNull()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId != null ? Guid.Parse(userId) : null;
        }
    }
}