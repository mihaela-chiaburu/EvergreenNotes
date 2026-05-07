using EvergreenNotes.Domain.DTO;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface ISearchService
    {
        Task<List<NoteResponse>> SearchNotesAsync(Guid? currentUserId, Guid gardenUserId, string? query);
        Task<List<ExploreGardensResponse>> SearchUsersAsync(Guid? currentUserId, string? query);
    }
}