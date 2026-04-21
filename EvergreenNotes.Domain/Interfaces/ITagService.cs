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
        Task<TagResponse> CreateTagAsync(Guid userId, string name, Guid? parentTagId);
        Task<List<TagResponse>> GetAllTagsAsync(Guid userId);
        Task<List<TaxonomyTagNodeResponse>> GetTagTreeAsync(Guid userId);
        Task<List<TaxonomyTagSearchItemResponse>> SearchTagsAsync(Guid userId, string query, Guid? parentTagId = null, int limit = 20);
        Task<TagResponse> UpdateTagNameAsync(Guid userId, Guid tagId, string name);
        Task DeleteTagAsync(Guid userId, Guid tagId, Guid? moveNotesToTagId = null, bool cascadeDeleteNotes = false);
        Task AddTagToNoteAsync(Guid userId, Guid noteId, Guid tagId);
        Task ReplaceNoteTagsAsync(Guid userId, Guid noteId, List<string> tagNames);
        Task RemoveTagFromNoteAsync(Guid userId, Guid noteId, Guid tagId);
        Task<List<NoteResponse>> GetNotesByTagAsync(Guid userId, Guid tagId);
    }
}