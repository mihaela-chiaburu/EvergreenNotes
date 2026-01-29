using EvergreenNotes.Domain.DTO;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface IInterestService
    {
        Task<List<InterestResponse>> GetAllInterestsAsync();
        Task<List<InterestGardenResponse>> GetGardensByInterestAsync(string interest, Guid? currentUserId);
    }
}