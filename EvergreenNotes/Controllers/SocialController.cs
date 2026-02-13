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
    public class SocialController : ControllerBase
    {
        private readonly ISocialService _socialService;

        public SocialController(ISocialService socialService)
        {
            _socialService = socialService;
        }

        [HttpPost("users/{userId}/follow")]
        public async Task<IActionResult> FollowUser(Guid userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _socialService.FollowUserAsync(currentUserId, userId);
                return Ok(new { message = "Successfully followed user" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("users/{userId}/follow")]
        public async Task<IActionResult> UnfollowUser(Guid userId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                await _socialService.UnfollowUserAsync(currentUserId, userId);
                return Ok(new { message = "Successfully unfollowed user" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("users/me/following")]
        public async Task<IActionResult> GetFollowing()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var result = await _socialService.GetFollowingAsync(currentUserId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("notes/{noteId}/comments")]
        public async Task<IActionResult> AddComment(Guid noteId, [FromBody] CreateCommentRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var result = await _socialService.AddCommentAsync(currentUserId, noteId, request.Content);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("notes/{noteId}/comments")]
        public async Task<IActionResult> GetComments(Guid noteId)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _socialService.GetCommentsAsync(noteId, currentUserId);
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