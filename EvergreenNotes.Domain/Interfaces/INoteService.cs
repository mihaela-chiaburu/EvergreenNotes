using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface INoteService
    {
        Task<NoteResponse> CreateNoteAsync(Guid userId, CreateNoteRequest request);
        Task<NoteResponse?> GetNoteByIdAsync(Guid noteId, Guid? currentUserId);
        Task<NoteResponse> UpdateNoteAsync(Guid noteId, Guid userId, UpdateNoteRequest request);
        Task DeleteNoteAsync(Guid noteId, Guid userId);
        Task<List<NoteResponse>> GetNotesAsync(Guid userId, GetNotesRequest request);
        Task<NoteResponse> WaterNoteAsync(Guid noteId, Guid userId);
        Task<NoteResponse> UpdateNoteStatusAsync(Guid noteId, Guid userId, NoteStatus status);
        Task<NoteResponse> UpdateNoteVisibilityAsync(Guid noteId, Guid userId, NoteVisibility visibility);
        Task<List<NoteResponse>> GetDeletedNotesAsync(Guid userId, int page = 1, int pageSize = 100);
        Task<NoteResponse> RestoreNoteAsync(Guid noteId, Guid userId);
        Task PermanentlyDeleteNoteAsync(Guid noteId, Guid userId);
        Task EmptyTrashAsync(Guid userId);
        Task<List<NoteResponse>> GetPublicNotesByUserIdAsync(Guid targetUserId, Guid? currentUserId, int page = 1, int pageSize = 100);
    }
}