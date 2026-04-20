using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace EvergreenNotes.Application.Services
{
    public class NoteService : INoteService
    {
        private static readonly int[] ReviewIntervalsInDays = [1, 3, 7, 14, 30, 60];
        private readonly AppDbContext _db;
        private readonly IReviewQuestionGenerator _reviewQuestionGenerator;

        public NoteService(AppDbContext db, IReviewQuestionGenerator reviewQuestionGenerator)
        {
            _db = db;
            _reviewQuestionGenerator = reviewQuestionGenerator;
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
                LastWateredAt = DateTime.UtcNow,
                LastReviewedAt = DateTime.UtcNow,
                NextReviewAt = DateTime.UtcNow.AddDays(ReviewIntervalsInDays[0]),
                ReviewCount = 0,
                CurrentReviewIntervalDays = ReviewIntervalsInDays[0]
            };

            _db.Notes.Add(note);
            await _db.SaveChangesAsync();

            return MapToResponse(note, new List<string>());
        }

        public async Task<NoteResponse?> GetNoteByIdAsync(Guid noteId, Guid? currentUserId)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null) return null;
            if (note.IsDeleted) return null;

            if (note.Visibility == NoteVisibility.Private && note.UserId != currentUserId)
                return null;

            EnsureReviewFields(note, DateTime.UtcNow);
            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task<NoteResponse> UpdateNoteAsync(Guid noteId, Guid userId, UpdateNoteRequest request)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null || note.UserId != userId || note.IsDeleted)
                throw new Exception("Note not found or access denied");

            if (request.Title != null) note.Title = request.Title;
            if (request.Content != null) note.Content = request.Content;

            note.LastWateredAt = DateTime.UtcNow;
            note.CachedReviewQuestion = null;
            note.CachedReviewQuestionGeneratedAt = null;
            note.CachedReviewQuestionContentHash = null;

            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task DeleteNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            if (note.IsDeleted)
                throw new Exception("Note is already in trash");

            note.IsDeleted = true;
            note.DeletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task<List<NoteResponse>> GetNotesAsync(Guid userId, GetNotesRequest request)
        {
            var query = _db.Notes.Where(n => n.UserId == userId && !n.IsDeleted);

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

            var notes = await query
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .OrderByDescending(n => n.LastWateredAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var reviewFieldsChanged = false;
            foreach (var note in notes)
            {
                reviewFieldsChanged = EnsureReviewFields(note, now) || reviewFieldsChanged;
                UpdatePlantState(note);
            }

            if (reviewFieldsChanged)
            {
                await _db.SaveChangesAsync();
            }

            if (request.PlantState.HasValue)
            {
                notes = notes.Where(n => n.PlantState == request.PlantState.Value).ToList();
            }

            return notes.Select(note =>
            {
                var tags = note.NoteTags
                    .Select(nt => nt.Tag.Name)
                    .OrderBy(name => name)
                    .ToList();

                return MapToResponse(note, tags);
            }).ToList();
        }

        public async Task<NoteResponse> WaterNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null || note.UserId != userId || note.IsDeleted)
                throw new Exception("Note not found or access denied");

            note.LastWateredAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task<NoteResponse> UpdateNoteStatusAsync(Guid noteId, Guid userId, NoteStatus status)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null || note.UserId != userId || note.IsDeleted)
                throw new Exception("Note not found or access denied");

            note.Status = status;
            note.LastWateredAt = DateTime.UtcNow; 
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task<NoteResponse> UpdateNoteVisibilityAsync(Guid noteId, Guid userId, NoteVisibility visibility)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null || note.UserId != userId || note.IsDeleted)
                throw new Exception("Note not found or access denied");

            note.Visibility = visibility;
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task<List<NoteResponse>> GetDeletedNotesAsync(Guid userId, int page = 1, int pageSize = 100)
        {
            var notes = await _db.Notes
                .Where(note => note.UserId == userId && note.IsDeleted)
                .Include(note => note.NoteTags)
                .ThenInclude(noteTag => noteTag.Tag)
                .OrderByDescending(note => note.DeletedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return notes.Select(note =>
            {
                var tags = note.NoteTags
                    .Select(noteTag => noteTag.Tag.Name)
                    .OrderBy(name => name)
                    .ToList();

                return MapToResponse(note, tags);
            }).ToList();
        }

        public async Task<NoteResponse> RestoreNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes
                .Include(n => n.NoteTags)
                .ThenInclude(nt => nt.Tag)
                .FirstOrDefaultAsync(n => n.Id == noteId);

            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            if (!note.IsDeleted)
                throw new Exception("Note is not in trash");

            note.IsDeleted = false;
            note.DeletedAt = null;
            await _db.SaveChangesAsync();

            UpdatePlantState(note);
            var tags = note.NoteTags
                .Select(nt => nt.Tag.Name)
                .OrderBy(name => name)
                .ToList();

            return MapToResponse(note, tags);
        }

        public async Task PermanentlyDeleteNoteAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

            if (note == null)
                throw new Exception("Note not found or access denied");

            if (!note.IsDeleted)
                throw new Exception("Note must be moved to trash before permanent delete");

            _db.Notes.Remove(note);
            await _db.SaveChangesAsync();
        }

        public async Task EmptyTrashAsync(Guid userId)
        {
            var deletedNotes = await _db.Notes
                .Where(n => n.UserId == userId && n.IsDeleted)
                .ToListAsync();

            if (deletedNotes.Count == 0)
                return;

            _db.Notes.RemoveRange(deletedNotes);
            await _db.SaveChangesAsync();
        }

        public async Task<List<NoteResponse>> GetPublicNotesByUserIdAsync(Guid targetUserId, Guid? currentUserId, int page = 1, int pageSize = 100)
        {
            var isOwner = currentUserId == targetUserId;

            if (!isOwner)
            {
                var garden = await _db.Gardens.FirstOrDefaultAsync(g => g.UserId == targetUserId);
                if (garden == null || garden.Visibility == GardenVisibility.Private)
                {
                    return new List<NoteResponse>();
                }
            }

            var notesQuery = _db.Notes.Where(note => note.UserId == targetUserId);
            if (!isOwner)
            {
                notesQuery = notesQuery.Where(note => note.Visibility == NoteVisibility.Public);
            }

            notesQuery = notesQuery.Where(note => !note.IsDeleted);

            var notes = await notesQuery
                .Include(note => note.NoteTags)
                .ThenInclude(noteTag => noteTag.Tag)
                .OrderByDescending(note => note.LastWateredAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var now = DateTime.UtcNow;
            var reviewFieldsChanged = false;
            foreach (var note in notes)
            {
                reviewFieldsChanged = EnsureReviewFields(note, now) || reviewFieldsChanged;
                UpdatePlantState(note);
            }

            if (reviewFieldsChanged)
            {
                await _db.SaveChangesAsync();
            }

            return notes.Select(note =>
            {
                var tags = note.NoteTags
                    .Select(noteTag => noteTag.Tag.Name)
                    .OrderBy(name => name)
                    .ToList();

                return MapToResponse(note, tags);
            }).ToList();
        }

        public async Task<GardenCareQueueResponse> GetGardenCareQueueAsync(Guid userId)
        {
            var now = DateTime.UtcNow;
            var notes = await _db.Notes
                .Where(note => note.UserId == userId && !note.IsDeleted)
                .Include(note => note.NoteTags)
                .ThenInclude(noteTag => noteTag.Tag)
                .OrderBy(note => note.NextReviewAt)
                .ToListAsync();

            var reviewFieldsChanged = false;
            var dueNotes = new List<DueReviewNoteResponse>();
            var growingNotes = new List<GrowingReviewNoteResponse>();

            foreach (var note in notes)
            {
                reviewFieldsChanged = EnsureReviewFields(note, now) || reviewFieldsChanged;
                var tags = note.NoteTags
                    .Select(noteTag => noteTag.Tag.Name)
                    .OrderBy(name => name)
                    .ToList();

                if (note.NextReviewAt <= now)
                {
                    var question = await GetOrGenerateQuestionAsync(note);
                    dueNotes.Add(new DueReviewNoteResponse
                    {
                        NoteId = note.Id,
                        Title = note.Title,
                        Tags = tags,
                        LastReviewedAt = note.LastReviewedAt,
                        NextReviewAt = note.NextReviewAt,
                        ReviewIntervalDays = Math.Max(1, note.CurrentReviewIntervalDays),
                        Question = question
                    });
                }
                else
                {
                    growingNotes.Add(new GrowingReviewNoteResponse
                    {
                        NoteId = note.Id,
                        Title = note.Title,
                        Tags = tags,
                        LastReviewedAt = note.LastReviewedAt,
                        NextReviewAt = note.NextReviewAt,
                        DaysUntilReview = Math.Max(1, (int)Math.Ceiling((note.NextReviewAt - now).TotalDays)),
                        ReviewIntervalDays = Math.Max(1, note.CurrentReviewIntervalDays)
                    });
                }
            }

            if (reviewFieldsChanged)
            {
                await _db.SaveChangesAsync();
            }

            return new GardenCareQueueResponse
            {
                GeneratedAt = now,
                TotalNotes = notes.Count,
                DueTodayCount = dueNotes.Count,
                GrowingCount = growingNotes.Count,
                ReviewStreakDays = CalculateReviewStreakDays(notes, now),
                ReadyForReflection = dueNotes
                    .OrderBy(due => due.NextReviewAt)
                    .ThenBy(due => due.Title)
                    .ToList(),
                Growing = growingNotes
                    .OrderBy(growing => growing.NextReviewAt)
                    .ThenBy(growing => growing.Title)
                    .ToList()
            };
        }

        public async Task<CompleteReviewResponse> CompleteReviewAsync(Guid noteId, Guid userId)
        {
            var note = await _db.Notes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId && !n.IsDeleted);

            if (note == null)
                throw new Exception("Note not found or access denied");

            var now = DateTime.UtcNow;
            EnsureReviewFields(note, now);

            note.ReviewCount += 1;
            note.LastReviewedAt = now;
            note.LastWateredAt = now;

            var nextInterval = ReviewIntervalsInDays[Math.Min(note.ReviewCount, ReviewIntervalsInDays.Length - 1)];
            note.CurrentReviewIntervalDays = nextInterval;
            note.NextReviewAt = now.AddDays(nextInterval);

            await _db.SaveChangesAsync();

            return new CompleteReviewResponse
            {
                NoteId = note.Id,
                LastReviewedAt = note.LastReviewedAt,
                NextReviewAt = note.NextReviewAt,
                ReviewCount = note.ReviewCount,
                ReviewIntervalDays = note.CurrentReviewIntervalDays
            };
        }

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

        private static NoteResponse MapToResponse(Note note, List<string> tags)
        {
            var daysSinceWatered = (DateTime.UtcNow - note.LastWateredAt).Days;
            var mappedLastReviewedAt = note.LastReviewedAt == default
                ? (note.LastWateredAt == default ? note.CreatedAt : note.LastWateredAt)
                : note.LastReviewedAt;
            var mappedReviewInterval = note.CurrentReviewIntervalDays <= 0 ? ReviewIntervalsInDays[0] : note.CurrentReviewIntervalDays;
            var mappedNextReviewAt = note.NextReviewAt == default
                ? mappedLastReviewedAt.AddDays(mappedReviewInterval)
                : note.NextReviewAt;

            return new NoteResponse
            {
                Id = note.Id,
                UserId = note.UserId,
                Title = note.Title,
                Content = note.Content,
                Status = note.Status.ToString().ToLower(),
                Visibility = note.Visibility.ToString().ToLower(),
                PlantState = note.PlantState.ToString().ToLower(),
                Tags = tags,
                SourceUrl = note.SourceUrl,
                SourceType = note.SourceType,
                SourceThumbnail = note.SourceThumbnail,
                CreatedAt = note.CreatedAt,
                LastWateredAt = note.LastWateredAt,
                LastReviewedAt = mappedLastReviewedAt,
                NextReviewAt = mappedNextReviewAt,
                ReviewCount = Math.Max(0, note.ReviewCount),
                CurrentReviewIntervalDays = mappedReviewInterval,
                CachedReviewQuestion = note.CachedReviewQuestion,
                CachedReviewQuestionGeneratedAt = note.CachedReviewQuestionGeneratedAt,
                DeletedAt = note.DeletedAt,
                DaysSinceWatered = daysSinceWatered
            };
        }

        private static bool EnsureReviewFields(Note note, DateTime now)
        {
            var changed = false;

            if (note.LastReviewedAt == default)
            {
                note.LastReviewedAt = note.LastWateredAt == default ? note.CreatedAt : note.LastWateredAt;
                changed = true;
            }

            if (note.CurrentReviewIntervalDays <= 0)
            {
                note.CurrentReviewIntervalDays = ReviewIntervalsInDays[0];
                changed = true;
            }

            if (note.NextReviewAt == default)
            {
                note.NextReviewAt = note.LastReviewedAt == default
                    ? now.AddDays(note.CurrentReviewIntervalDays)
                    : note.LastReviewedAt.AddDays(note.CurrentReviewIntervalDays);
                changed = true;
            }

            if (note.ReviewCount < 0)
            {
                note.ReviewCount = 0;
                changed = true;
            }

            return changed;
        }

        private async Task<string> GetOrGenerateQuestionAsync(Note note)
        {
            var contentHash = ComputeContentHash(note.Title, note.Content);
            var hasFreshCachedQuestion =
                !string.IsNullOrWhiteSpace(note.CachedReviewQuestion)
                && string.Equals(note.CachedReviewQuestionContentHash, contentHash, StringComparison.Ordinal)
                && note.CachedReviewQuestionGeneratedAt.HasValue
                && note.CachedReviewQuestionGeneratedAt.Value >= DateTime.UtcNow.AddHours(-24);

            if (hasFreshCachedQuestion)
            {
                return note.CachedReviewQuestion!;
            }

            var question = await _reviewQuestionGenerator.GenerateQuestionAsync(note.Title, note.Content);
            note.CachedReviewQuestion = question;
            note.CachedReviewQuestionGeneratedAt = DateTime.UtcNow;
            note.CachedReviewQuestionContentHash = contentHash;
            await _db.SaveChangesAsync();

            return question;
        }

        private static string ComputeContentHash(string title, string content)
        {
            var payload = $"{title ?? string.Empty}\n---\n{content ?? string.Empty}";
            var bytes = Encoding.UTF8.GetBytes(payload);
            var hashBytes = SHA256.HashData(bytes);
            return Convert.ToHexString(hashBytes);
        }

        private static int CalculateReviewStreakDays(IEnumerable<Note> notes, DateTime now)
        {
            var localToday = now.Date;
            var reviewedDates = notes
                .Where(note => note.LastReviewedAt != default)
                .Select(note => note.LastReviewedAt.Date)
                .Distinct()
                .OrderByDescending(date => date)
                .ToHashSet();

            var streak = 0;
            var cursor = localToday;
            while (reviewedDates.Contains(cursor))
            {
                streak += 1;
                cursor = cursor.AddDays(-1);
            }

            return streak;
        }
    }
}