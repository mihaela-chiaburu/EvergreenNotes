using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("notes")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchNotes([FromQuery] string? query, [FromQuery] Guid userId)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _searchService.SearchNotesAsync(currentUserId, userId, query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("users")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchUsers([FromQuery] string? query)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _searchService.SearchUsersAsync(currentUserId, query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId != null ? Guid.Parse(userId) : null;
        }
    }
}