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
    public class ConnectionsController : ControllerBase
    {
        private readonly IConnectionService _connectionService;

        public ConnectionsController(IConnectionService connectionService)
        {
            _connectionService = connectionService;
        }

        // POST /api/notes/{noteId}/connections - Link two notes
        [HttpPost("notes/{noteId}/connections")]
        public async Task<IActionResult> CreateConnection(Guid noteId, [FromBody] CreateConnectionRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _connectionService.CreateConnectionAsync(userId, noteId, request.TargetNoteId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE /api/connections/{connectionId} - Remove link
        [HttpDelete("connections/{connectionId}")]
        public async Task<IActionResult> DeleteConnection(Guid connectionId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _connectionService.DeleteConnectionAsync(userId, connectionId);
                return Ok(new { message = "Connection deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET /api/notes/{noteId}/connections - Get connected notes
        [HttpGet("notes/{noteId}/connections")]
        public async Task<IActionResult> GetConnectedNotes(Guid noteId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _connectionService.GetConnectedNotesAsync(userId, noteId);
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