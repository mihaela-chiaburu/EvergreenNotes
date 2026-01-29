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

        // POST /api/notes - Create a new note
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

        // GET /api/notes/{noteId} - Get note by ID
        [HttpGet("{noteId}")]
        [AllowAnonymous] // Public notes can be viewed by anyone
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

        // PUT /api/notes/{noteId} - Update note
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

        // DELETE /api/notes/{noteId} - Delete note
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

        // GET /api/notes - Get user's notes (with filters)
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

        // POST /api/notes/{noteId}/water - Water a note
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

        // PUT /api/notes/{noteId}/status - Change note status (rough/polished)
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

        // PUT /api/notes/{noteId}/visibility - Change note visibility (private/public)
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

        // Helper methods
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