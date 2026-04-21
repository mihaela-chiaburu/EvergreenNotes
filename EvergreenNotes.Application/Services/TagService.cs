using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class TagService : ITagService
    {
        private readonly AppDbContext _db;
        private readonly INoteService _noteService;

        public TagService(AppDbContext db, INoteService noteService)
        {
            _db = db;
            _noteService = noteService;
        }

        public async Task<TagResponse> CreateTagAsync(Guid userId, string name)
        {
            return await CreateTagAsync(userId, name, null);
        }

        public async Task<TagResponse> CreateTagAsync(Guid userId, string name, Guid? parentTagId)
        {
            var normalizedName = NormalizeTagName(name);

            if (string.IsNullOrWhiteSpace(normalizedName))
                throw new Exception("Tag name cannot be empty");

            if (parentTagId.HasValue)
            {
                var parentTag = await _db.Tags.FirstOrDefaultAsync(t => t.Id == parentTagId.Value && t.UserId == userId);
                if (parentTag == null)
                {
                    throw new Exception("Parent tag not found");
                }
            }

            var existingTag = await _db.Tags
                .FirstOrDefaultAsync(t =>
                    t.UserId == userId &&
                    t.ParentTagId == parentTagId &&
                    t.Name.ToLower() == normalizedName.ToLower());

            if (existingTag != null)
                return MapToResponse(existingTag);

            var tag = new Tag
            {
                Name = normalizedName,
                UserId = userId,
                ParentTagId = parentTagId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Tags.Add(tag);
            await _db.SaveChangesAsync();

            return MapToResponse(tag);
        }

        public async Task<List<TagResponse>> GetAllTagsAsync(Guid userId)
        {
            var tags = await _db.Tags
                .Where(t => t.UserId == userId)
                .Include(t => t.NoteTags)
                .OrderBy(t => t.Name)
                .ToListAsync();

            return tags.Select(MapToResponse).ToList();
        }

        public async Task<List<TaxonomyTagNodeResponse>> GetTagTreeAsync(Guid userId)
        {
            var tags = await _db.Tags
                .Where(t => t.UserId == userId)
                .Include(t => t.NoteTags)
                .OrderBy(t => t.Name)
                .ToListAsync();

            return tags
                .Select(tag => new TaxonomyTagNodeResponse
                {
                    Id = tag.Id,
                    Name = tag.Name,
                    ParentTagId = tag.ParentTagId,
                    Depth = 0,
                    Path = tag.Name,
                    NotesCount = tag.NoteTags.Count,
                    Children = new List<TaxonomyTagNodeResponse>()
                })
                .ToList();
        }

        public async Task<List<TaxonomyTagSearchItemResponse>> SearchTagsAsync(Guid userId, string query, Guid? parentTagId = null, int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<TaxonomyTagSearchItemResponse>();
            }

            var normalizedQuery = query.Trim().ToLower();

            var tags = await _db.Tags
                .Where(t => t.UserId == userId)
                .Where(t => t.Name.ToLower().Contains(normalizedQuery))
                .OrderBy(t => t.Name)
                .Take(Math.Clamp(limit, 1, 50))
                .ToListAsync();

            return tags
                .Select(tag => new TaxonomyTagSearchItemResponse
                {
                    Id = tag.Id,
                    Name = tag.Name,
                    ParentTagId = tag.ParentTagId,
                    Depth = 0,
                    Path = tag.Name
                })
                .ToList();
        }

        public async Task<TagResponse> UpdateTagNameAsync(Guid userId, Guid tagId, string name)
        {
            var normalizedName = NormalizeTagName(name);

            if (string.IsNullOrWhiteSpace(normalizedName))
                throw new Exception("Tag name cannot be empty");

            var tag = await _db.Tags
                .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);

            if (tag == null)
                throw new Exception("Tag not found or access denied");

            var duplicateTag = await _db.Tags
                .FirstOrDefaultAsync(t =>
                    t.Id != tag.Id &&
                    t.UserId == userId &&
                    t.ParentTagId == tag.ParentTagId &&
                    t.Name.ToLower() == normalizedName.ToLower());

            if (duplicateTag != null)
                throw new Exception("A tag with this name already exists at the same level");

            tag.Name = normalizedName;
            await _db.SaveChangesAsync();

            return MapToResponse(tag);
        }

        public async Task DeleteTagAsync(Guid userId, Guid tagId, Guid? moveNotesToTagId = null, bool cascadeDeleteNotes = false)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var tag = await _db.Tags
                    .Include(t => t.NoteTags)
                    .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId);

                if (tag == null)
                    throw new Exception("Tag not found or access denied");

                if (moveNotesToTagId == Guid.Empty)
                {
                    moveNotesToTagId = null;
                }

                Tag? targetTag = null;
                if (moveNotesToTagId.HasValue)
                {
                    if (moveNotesToTagId.Value == tagId)
                        throw new Exception("Cannot move notes to the same tag being deleted");

                    targetTag = await _db.Tags
                        .FirstOrDefaultAsync(t => t.Id == moveNotesToTagId.Value && t.UserId == userId);

                    if (targetTag == null)
                        throw new Exception("Target tag not found or access denied");
                }

                var linkedNoteIds = tag.NoteTags
                    .Select(nt => nt.NoteId)
                    .Distinct()
                    .ToList();

                if (linkedNoteIds.Count > 0)
                {
                    if (targetTag != null)
                    {
                        var existingTargetLinks = await _db.NoteTags
                            .Where(nt => nt.TagId == targetTag.Id && linkedNoteIds.Contains(nt.NoteId))
                            .Select(nt => nt.NoteId)
                            .ToListAsync();

                        var existingTargetLinkSet = existingTargetLinks.ToHashSet();
                        var linksToAdd = linkedNoteIds
                            .Where(noteId => !existingTargetLinkSet.Contains(noteId))
                            .Select(noteId => new NoteTag
                            {
                                NoteId = noteId,
                                TagId = targetTag.Id,
                                CreatedAt = DateTime.UtcNow
                            });

                        await _db.NoteTags.AddRangeAsync(linksToAdd);
                    }
                    else if (cascadeDeleteNotes)
                    {
                        var notesToDelete = await _db.Notes
                            .Where(n => n.UserId == userId && linkedNoteIds.Contains(n.Id) && !n.IsDeleted)
                            .ToListAsync();

                        var deletedAt = DateTime.UtcNow;
                        foreach (var note in notesToDelete)
                        {
                            note.IsDeleted = true;
                            note.DeletedAt = deletedAt;
                        }
                    }
                    else
                    {
                        throw new Exception("This tag contains notes. Move notes to another tag or use cascade delete.");
                    }
                }

                var childTags = await _db.Tags
                    .Where(t => t.UserId == userId && t.ParentTagId == tagId)
                    .ToListAsync();

                foreach (var childTag in childTags)
                {
                    childTag.ParentTagId = null;
                }

                var noteLinksForDeletedTag = await _db.NoteTags
                    .Where(nt => nt.TagId == tagId)
                    .ToListAsync();

                _db.NoteTags.RemoveRange(noteLinksForDeletedTag);
                _db.Tags.Remove(tag);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task AddTagToNoteAsync(Guid userId, Guid noteId, Guid tagId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            var tag = await _db.Tags.FindAsync(tagId);
            if (tag == null || tag.UserId != userId)
                throw new Exception("Tag not found or access denied");

            var existingNoteTag = await _db.NoteTags
                .FirstOrDefaultAsync(nt => nt.NoteId == noteId && nt.TagId == tagId);

            if (existingNoteTag != null)
                throw new Exception("Tag is already added to this note");

            var noteTag = new NoteTag
            {
                NoteId = noteId,
                TagId = tagId,
                CreatedAt = DateTime.UtcNow
            };

            _db.NoteTags.Add(noteTag);

            note.LastWateredAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        public async Task ReplaceNoteTagsAsync(Guid userId, Guid noteId, List<string> tagNames)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            var resolvedTags = new List<Tag>();

            foreach (var rawTag in tagNames)
            {
                var normalizedTag = NormalizeTagName(rawTag);
                if (string.IsNullOrWhiteSpace(normalizedTag))
                {
                    continue;
                }

                var existingTag = await _db.Tags.FirstOrDefaultAsync(t =>
                    t.UserId == userId &&
                    t.Name.ToLower() == normalizedTag.ToLower());

                if (existingTag == null)
                {
                    existingTag = new Tag
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Name = normalizedTag,
                        ParentTagId = null,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.Tags.Add(existingTag);
                    await _db.SaveChangesAsync();
                }

                if (resolvedTags.All(tag => tag.Id != existingTag.Id))
                {
                    resolvedTags.Add(existingTag);
                }
            }

            var existingLinks = await _db.NoteTags.Where(nt => nt.NoteId == noteId).ToListAsync();
            _db.NoteTags.RemoveRange(existingLinks);

            foreach (var tag in resolvedTags)
            {
                _db.NoteTags.Add(new NoteTag
                {
                    NoteId = noteId,
                    TagId = tag.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
        }

        public async Task RemoveTagFromNoteAsync(Guid userId, Guid noteId, Guid tagId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            var noteTag = await _db.NoteTags
                .FirstOrDefaultAsync(nt => nt.NoteId == noteId && nt.TagId == tagId);

            if (noteTag == null)
                throw new Exception("Tag not found on this note");

            _db.NoteTags.Remove(noteTag);
            await _db.SaveChangesAsync();
        }

        public async Task<List<NoteResponse>> GetNotesByTagAsync(Guid userId, Guid tagId)
        {
            var tag = await _db.Tags.FindAsync(tagId);
            if (tag == null || tag.UserId != userId)
                throw new Exception("Tag not found or access denied");

            var noteIds = await _db.NoteTags
                .Where(nt => nt.TagId == tagId)
                .Select(nt => nt.NoteId)
                .ToListAsync();

            var notes = new List<NoteResponse>();
            foreach (var noteId in noteIds)
            {
                var note = await _noteService.GetNoteByIdAsync(noteId, userId);
                if (note != null)
                    notes.Add(note);
            }

            return notes.OrderByDescending(n => n.LastWateredAt).ToList();
        }

        private TagResponse MapToResponse(Tag tag)
        {
            return new TagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                CreatedAt = tag.CreatedAt,
                NoteCount = tag.NoteTags?.Count ?? 0
            };
        }

        private static string NormalizeTagName(string name)
        {
            var trimmed = name.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
            {
                return string.Empty;
            }

            return trimmed;
        }

    }
}