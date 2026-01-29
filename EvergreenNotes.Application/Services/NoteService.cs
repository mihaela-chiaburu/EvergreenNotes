using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class NoteService : INoteService
    {
        private readonly AppDbContext _db;

        public NoteService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<NoteResponse> CreateNoteAsync(Guid userId, CreateNoteRequest request)
        {
            var note = new Note
            {
                UserId = userId,
                Title = request.Title,
                Content = request.Content,
                SourceUrl = request.SourceUrl,
                SourceType = request.SourceType,
                SourceThumbnail = request.SourceThumbnail,
                Status = NoteStatus.Rough,
                Visibility = NoteVisibility.Private,
                PlantState = PlantState.Fresh,
                CreatedAt = DateTime.UtcNow,
                LastWateredAt = DateTime.UtcNow
            };

            _db.Notes.Add(note);
            await _db.SaveChangesAsync();

            return MapToResponse(note);
        }

        public async Task<NoteResponse?> GetNoteByIdAsync(Guid noteId, Guid? currentUserId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null) return null;

            // Check permissions: private notes only visible to owner
            if (note.Visibility == NoteVisibility.Private && note.UserId != currentUserId)
                return null;

            UpdatePlantState(note);
            return MapToResponse(note);
        }

        public async Task<NoteResponse> UpdateNoteAsync(Guid noteId, Guid userId, UpdateNoteRequest request)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            if (request.Title != null) note.Title = request.Title;
            if (request.Content != null) note.Content = request.Content;

            // Updating is a watering action
            note.LastWateredAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            return MapToResponse(note);
        }

        public async Task DeleteNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            _db.Notes.Remove(note);
            await _db.SaveChangesAsync();
        }

        public async Task<List<NoteResponse>> GetNotesAsync(Guid userId, GetNotesRequest request)
        {
            var query = _db.Notes.Where(n => n.UserId == userId);

            // Filters
            if (request.Status.HasValue)
                query = query.Where(n => n.Status == request.Status.Value);

            if (request.Visibility.HasValue)
                query = query.Where(n => n.Visibility == request.Visibility.Value);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(n =>
                    n.Title.ToLower().Contains(search) ||
                    n.Content.ToLower().Contains(search));
            }

            // Pagination
            var notes = await query
                .OrderByDescending(n => n.LastWateredAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Update plant states and filter if needed
            foreach (var note in notes)
            {
                UpdatePlantState(note);
            }

            if (request.PlantState.HasValue)
            {
                notes = notes.Where(n => n.PlantState == request.PlantState.Value).ToList();
            }

            return notes.Select(MapToResponse).ToList();
        }

        public async Task<NoteResponse> WaterNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            note.LastWateredAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            return MapToResponse(note);
        }

        public async Task<NoteResponse> UpdateNoteStatusAsync(Guid noteId, Guid userId, NoteStatus status)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            note.Status = status;
            note.LastWateredAt = DateTime.UtcNow; // Status change is a watering action
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            return MapToResponse(note);
        }

        public async Task<NoteResponse> UpdateNoteVisibilityAsync(Guid noteId, Guid userId, NoteVisibility visibility)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            note.Visibility = visibility;
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            return MapToResponse(note);
        }

        // Helper: Calculate plant state based on last watered date
        private void UpdatePlantState(Note note)
        {
            var daysSinceWatered = (DateTime.UtcNow - note.LastWateredAt).Days;

            if (daysSinceWatered <= 2)
                note.PlantState = PlantState.Fresh;
            else if (daysSinceWatered <= 7)
                note.PlantState = PlantState.Healthy;
            else if (daysSinceWatered <= 14)
                note.PlantState = PlantState.Pale;
            else
                note.PlantState = PlantState.Dry;
        }

        // Helper: Map Note entity to NoteResponse DTO
        private NoteResponse MapToResponse(Note note)
        {
            var daysSinceWatered = (DateTime.UtcNow - note.LastWateredAt).Days;

            return new NoteResponse
            {
                Id = note.Id,
                UserId = note.UserId,
                Title = note.Title,
                Content = note.Content,
                Status = note.Status.ToString().ToLower(),
                Visibility = note.Visibility.ToString().ToLower(),
                PlantState = note.PlantState.ToString().ToLower(),
                SourceUrl = note.SourceUrl,
                SourceType = note.SourceType,
                SourceThumbnail = note.SourceThumbnail,
                CreatedAt = note.CreatedAt,
                LastWateredAt = note.LastWateredAt,
                DaysSinceWatered = daysSinceWatered
            };
        }
    }
}