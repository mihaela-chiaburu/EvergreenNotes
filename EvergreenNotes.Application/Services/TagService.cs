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
            // Normalize tag name (lowercase, trim)
            var normalizedName = name.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(normalizedName))
                throw new Exception("Tag name cannot be empty");

            // Check if tag already exists for this user
            var existingTag = await _db.Tags
                .FirstOrDefaultAsync(t => t.UserId == userId && t.Name == normalizedName);

            if (existingTag != null)
                return MapToResponse(existingTag);

            // Create new tag
            var tag = new Tag
            {
                Name = normalizedName,
                UserId = userId,
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

        public async Task AddTagToNoteAsync(Guid userId, Guid noteId, Guid tagId)
        {
            // Verify note belongs to user
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            // Verify tag belongs to user
            var tag = await _db.Tags.FindAsync(tagId);
            if (tag == null || tag.UserId != userId)
                throw new Exception("Tag not found or access denied");

            // Check if tag is already added to note
            var existingNoteTag = await _db.NoteTags
                .FirstOrDefaultAsync(nt => nt.NoteId == noteId && nt.TagId == tagId);

            if (existingNoteTag != null)
                throw new Exception("Tag is already added to this note");

            // Add tag to note
            var noteTag = new NoteTag
            {
                NoteId = noteId,
                TagId = tagId,
                CreatedAt = DateTime.UtcNow
            };

            _db.NoteTags.Add(noteTag);

            // Adding a tag is a "watering" action
            note.LastWateredAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        public async Task RemoveTagFromNoteAsync(Guid userId, Guid noteId, Guid tagId)
        {
            // Verify note belongs to user
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            // Find and remove the NoteTag relationship
            var noteTag = await _db.NoteTags
                .FirstOrDefaultAsync(nt => nt.NoteId == noteId && nt.TagId == tagId);

            if (noteTag == null)
                throw new Exception("Tag not found on this note");

            _db.NoteTags.Remove(noteTag);
            await _db.SaveChangesAsync();
        }

        public async Task<List<NoteResponse>> GetNotesByTagAsync(Guid userId, Guid tagId)
        {
            // Verify tag belongs to user
            var tag = await _db.Tags.FindAsync(tagId);
            if (tag == null || tag.UserId != userId)
                throw new Exception("Tag not found or access denied");

            // Get all notes with this tag
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

        // Helper: Map Tag to TagResponse
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
    }
}