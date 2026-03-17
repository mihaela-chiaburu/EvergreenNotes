using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GardensController : ControllerBase
    {
        private readonly IGardenService _gardenService;

        public GardensController(IGardenService gardenService)
        {
            _gardenService = gardenService;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyGarden()
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _gardenService.GetMyGardenAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("me/graph")]
        public async Task<IActionResult> GetMyGardenGraph()
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _gardenService.GetMyGardenGraphAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyGarden([FromBody] UpdateGardenRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _gardenService.UpdateMyGardenAsync(userId, request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetPublicGarden(Guid userId)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _gardenService.GetPublicGardenAsync(userId, currentUserId);

                if (result == null)
                    return NotFound(new { error = "Garden not found or is private" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("explore")]
        public async Task<IActionResult> ExploreGardens([FromQuery] string? interest = null)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _gardenService.ExploreGardensAsync(currentUserId, interest);
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