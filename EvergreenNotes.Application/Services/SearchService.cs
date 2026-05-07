using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class SearchService : ISearchService
    {
        private readonly AppDbContext _db;

        public SearchService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<NoteResponse>> SearchNotesAsync(Guid? currentUserId, Guid gardenUserId, string? query)
        {
            var isOwner = currentUserId.HasValue && currentUserId.Value == gardenUserId;
            var normalizedQuery = string.IsNullOrWhiteSpace(query)
                ? string.Empty
                : query.Trim().ToLower();

            var notesQuery = _db.Notes
                .Where(note => note.UserId == gardenUserId && !note.IsDeleted);

            if (!isOwner)
            {
                notesQuery = notesQuery.Where(note => note.Visibility == NoteVisibility.Public);
            }

            if (!string.IsNullOrEmpty(normalizedQuery))
            {
                notesQuery = notesQuery.Where(note =>
                    note.Title.ToLower().Contains(normalizedQuery)
                    || note.Content.ToLower().Contains(normalizedQuery));
            }

            var notes = await notesQuery
                .Include(note => note.NoteTags)
                .ThenInclude(noteTag => noteTag.Tag)
                .OrderByDescending(note => note.LastWateredAt)
                .ToListAsync();

            return notes.Select(MapToNoteResponse).ToList();
        }

        public async Task<List<ExploreGardensResponse>> SearchUsersAsync(Guid? currentUserId, string? query)
        {
            var normalizedQuery = string.IsNullOrWhiteSpace(query)
                ? string.Empty
                : query.Trim().ToLower();

            var gardensQuery = _db.Gardens
                .Include(garden => garden.User)
                .Where(garden => garden.Visibility == GardenVisibility.Public);

            if (currentUserId.HasValue)
            {
                gardensQuery = gardensQuery.Where(garden => garden.UserId != currentUserId.Value);
            }

            if (!string.IsNullOrEmpty(normalizedQuery))
            {
                gardensQuery = gardensQuery.Where(garden =>
                    garden.User.Username.ToLower().Contains(normalizedQuery)
                    || (garden.Bio != null && garden.Bio.ToLower().Contains(normalizedQuery)));
            }

            var gardens = await gardensQuery.ToListAsync();
            var results = new List<ExploreGardensResponse>();

            foreach (var garden in gardens)
            {
                var totalNotes = await _db.Notes.CountAsync(note =>
                    note.UserId == garden.UserId
                    && !note.IsDeleted);

                var publicNotes = await _db.Notes.CountAsync(note =>
                    note.UserId == garden.UserId
                    && note.Visibility == NoteVisibility.Public
                    && !note.IsDeleted);

                var interests = await _db.Tags
                    .Where(tag => tag.UserId == garden.UserId)
                    .Include(tag => tag.NoteTags)
                    .OrderByDescending(tag => tag.NoteTags.Count)
                    .Take(5)
                    .Select(tag => tag.Name)
                    .ToListAsync();

                var lastNote = await _db.Notes
                    .Where(note => note.UserId == garden.UserId && !note.IsDeleted)
                    .OrderByDescending(note => note.LastWateredAt)
                    .FirstOrDefaultAsync();

                var recentPublicNote = await _db.Notes
                    .Where(note =>
                        note.UserId == garden.UserId
                        && note.Visibility == NoteVisibility.Public
                        && !note.IsDeleted)
                    .OrderByDescending(note => note.CreatedAt)
                    .FirstOrDefaultAsync();

                results.Add(new ExploreGardensResponse
                {
                    UserId = garden.UserId,
                    Username = garden.User.Username,
                    Bio = garden.Bio,
                    TotalNotes = totalNotes,
                    PublicNotes = publicNotes,
                    Interests = interests,
                    RecentNoteTitle = recentPublicNote?.Title,
                    RecentNoteText = recentPublicNote?.Content,
                    LastActive = lastNote?.LastWateredAt ?? garden.UpdatedAt,
                });
            }

            return results
                .OrderByDescending(result => result.LastActive)
                .ToList();
        }

        private static NoteResponse MapToNoteResponse(Note note)
        {
            var tags = note.NoteTags
                .Select(noteTag => noteTag.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return new NoteResponse
            {
                Id = note.Id,
                UserId = note.UserId,
                Title = note.Title,
                Content = note.Content,
                Status = note.Status.ToString(),
                Visibility = note.Visibility.ToString(),
                PlantState = note.PlantState.ToString(),
                Tags = tags,
                SourceUrl = note.SourceUrl,
                SourceType = note.SourceType,
                SourceThumbnail = note.SourceThumbnail,
                CreatedAt = note.CreatedAt,
                LastWateredAt = note.LastWateredAt,
                LastReviewedAt = note.LastReviewedAt,
                NextReviewAt = note.NextReviewAt,
                ReviewCount = note.ReviewCount,
                CurrentReviewIntervalDays = note.CurrentReviewIntervalDays,
                CachedReviewQuestion = note.CachedReviewQuestion,
                CachedReviewQuestionGeneratedAt = note.CachedReviewQuestionGeneratedAt,
                DeletedAt = note.DeletedAt,
                DaysSinceWatered = (DateTime.UtcNow.Date - note.LastWateredAt.Date).Days,
            };
        }
    }
}