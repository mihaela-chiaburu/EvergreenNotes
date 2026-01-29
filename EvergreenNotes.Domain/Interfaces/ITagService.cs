using EvergreenNotes.Domain.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface ITagService
    {
        Task<TagResponse> CreateTagAsync(Guid userId, string name);
        Task<List<TagResponse>> GetAllTagsAsync(Guid userId);
        Task AddTagToNoteAsync(Guid userId, Guid noteId, Guid tagId);
        Task RemoveTagFromNoteAsync(Guid userId, Guid noteId, Guid tagId);
        Task<List<NoteResponse>> GetNotesByTagAsync(Guid userId, Guid tagId);
    }
}