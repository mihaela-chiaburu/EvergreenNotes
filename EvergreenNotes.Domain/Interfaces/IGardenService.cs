using EvergreenNotes.Domain.DTO;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface IGardenService
    {
        Task<GardenResponse> GetMyGardenAsync(Guid userId);
        Task<GardenGraphResponse> GetMyGardenGraphAsync(Guid userId);
        Task<GardenGraphResponse?> GetPublicGardenGraphAsync(Guid targetUserId, Guid? currentUserId);
        Task<GardenResponse> UpdateMyGardenAsync(Guid userId, UpdateGardenRequest request);
        Task<GardenResponse?> GetPublicGardenAsync(Guid targetUserId, Guid? currentUserId);
        Task<List<ExploreGardensResponse>> ExploreGardensAsync(Guid? currentUserId, string? interest = null);
    }
}