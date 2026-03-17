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

            var byParent = tags
                .GroupBy(t => t.ParentTagId)
                .ToList();

            List<TaxonomyTagNodeResponse> BuildLevel(Guid? parentId, string parentPath, int depth)
            {
                var levelTags = byParent
                    .FirstOrDefault(group => group.Key == parentId)
                    ?.ToList();

                if (levelTags == null)
                {
                    return new List<TaxonomyTagNodeResponse>();
                }

                return levelTags
                    .OrderBy(t => t.Name)
                    .Select(tag =>
                    {
                        var path = string.IsNullOrWhiteSpace(parentPath)
                            ? tag.Name
                            : $"{parentPath} > {tag.Name}";

                        return new TaxonomyTagNodeResponse
                        {
                            Id = tag.Id,
                            Name = tag.Name,
                            ParentTagId = tag.ParentTagId,
                            Depth = depth,
                            Path = path,
                            NotesCount = tag.NoteTags.Count,
                            Children = BuildLevel(tag.Id, path, depth + 1)
                        };
                    })
                    .ToList();
            }

            return BuildLevel(null, string.Empty, 0);
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
                .Where(t => !parentTagId.HasValue || t.ParentTagId == parentTagId)
                .OrderBy(t => t.Name)
                .Take(Math.Clamp(limit, 1, 50))
                .ToListAsync();

            var result = new List<TaxonomyTagSearchItemResponse>();
            foreach (var tag in tags)
            {
                var path = await BuildPathAsync(tag);

                result.Add(new TaxonomyTagSearchItemResponse
                {
                    Id = tag.Id,
                    Name = tag.Name,
                    ParentTagId = tag.ParentTagId,
                    Depth = path.Count(part => part == '/') + 1,
                    Path = path
                });
            }

            return result;
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
                if (string.IsNullOrWhiteSpace(rawTag))
                {
                    continue;
                }

                var pathSegments = rawTag
                    .Split('>')
                    .Select(segment => NormalizeTagName(segment))
                    .Where(segment => !string.IsNullOrWhiteSpace(segment))
                    .ToList();

                if (pathSegments.Count == 0)
                {
                    continue;
                }

                Guid? parentTagId = null;
                Tag? currentTag = null;

                foreach (var segment in pathSegments)
                {
                    currentTag = await _db.Tags.FirstOrDefaultAsync(t =>
                        t.UserId == userId &&
                        t.ParentTagId == parentTagId &&
                        t.Name.ToLower() == segment.ToLower());

                    if (currentTag == null)
                    {
                        currentTag = new Tag
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            Name = segment,
                            ParentTagId = parentTagId,
                            CreatedAt = DateTime.UtcNow
                        };

                        _db.Tags.Add(currentTag);
                        await _db.SaveChangesAsync();
                    }

                    parentTagId = currentTag.Id;
                }

                if (currentTag != null && resolvedTags.All(tag => tag.Id != currentTag.Id))
                {
                    resolvedTags.Add(currentTag);
                }
            }

            await EnsureNoDuplicateNoteNameOnSamePathAsync(userId, noteId, note.Title, resolvedTags.Select(tag => tag.Id).ToList());

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

        private async Task EnsureNoDuplicateNoteNameOnSamePathAsync(Guid userId, Guid noteId, string noteTitle, List<Guid> resolvedTagIds)
        {
            var normalizedTitle = noteTitle.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(normalizedTitle))
            {
                return;
            }

            var candidateNotes = await _db.Notes
                .Where(note =>
                    note.UserId == userId &&
                    note.Id != noteId &&
                    note.Title.ToLower() == normalizedTitle)
                .Select(note => note.Id)
                .ToListAsync();

            if (candidateNotes.Count == 0)
            {
                return;
            }

            if (resolvedTagIds.Count == 0)
            {
                var hasRootConflict = await _db.NoteTags
                    .Where(link => candidateNotes.Contains(link.NoteId))
                    .AnyAsync() == false;

                if (hasRootConflict)
                {
                    throw new Exception("A note with the same title already exists on this path.");
                }

                return;
            }

            var hasPathConflict = await _db.NoteTags
                .Where(link => candidateNotes.Contains(link.NoteId) && resolvedTagIds.Contains(link.TagId))
                .AnyAsync();

            if (hasPathConflict)
            {
                throw new Exception("A note with the same title already exists on this path.");
            }
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

        private async Task<string> BuildPathAsync(Tag tag)
        {
            var parts = new List<string> { tag.Name };
            var parentId = tag.ParentTagId;

            while (parentId.HasValue)
            {
                var parent = await _db.Tags.FirstOrDefaultAsync(t => t.Id == parentId.Value && t.UserId == tag.UserId);
                if (parent == null)
                {
                    break;
                }

                parts.Add(parent.Name);
                parentId = parent.ParentTagId;
            }

            parts.Reverse();
            return string.Join(" > ", parts);
        }
    }
}