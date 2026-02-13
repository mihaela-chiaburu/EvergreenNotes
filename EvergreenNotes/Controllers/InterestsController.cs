using EvergreenNotes.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EvergreenNotes.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InterestsController : ControllerBase
    {
        private readonly IInterestService _interestService;

        public InterestsController(IInterestService interestService)
        {
            _interestService = interestService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllInterests()
        {
            try
            {
                var result = await _interestService.GetAllInterestsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{interest}/gardens")]
        public async Task<IActionResult> GetGardensByInterest(string interest)
        {
            try
            {
                var currentUserId = GetCurrentUserIdOrNull();
                var result = await _interestService.GetGardensByInterestAsync(interest, currentUserId);
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