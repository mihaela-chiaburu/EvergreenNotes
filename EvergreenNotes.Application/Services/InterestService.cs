using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class InterestService : IInterestService
    {
        private readonly AppDbContext _db;

        public InterestService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<InterestResponse>> GetAllInterestsAsync()
        {
            // Get all tags with their usage statistics
            var allTags = await _db.Tags
                .Include(t => t.NoteTags)
                .ToListAsync();

            // Group tags by normalized name (case-insensitive)
            var groupedTags = allTags
                .GroupBy(t => t.Name.ToLower())
                .Select(g => new
                {
                    Name = g.Key,
                    Tags = g.ToList()
                })
                .ToList();

            var interests = new List<InterestResponse>();

            foreach (var group in groupedTags)
            {
                // Count unique users who have this tag
                var usersWithTag = group.Tags
                    .Select(t => t.UserId)
                    .Distinct()
                    .Count();

                // Count total notes with this tag
                var totalNotes = group.Tags
                    .Sum(t => t.NoteTags.Count);

                // Only include interests that have at least 1 note
                if (totalNotes > 0)
                {
                    interests.Add(new InterestResponse
                    {
                        Name = group.Name,
                        UsersCount = usersWithTag,
                        NotesCount = totalNotes,
                        IsPopular = usersWithTag >= 5
                    });
                }
            }

            // Sort by popularity (users count, then notes count)
            return interests
                .OrderByDescending(i => i.UsersCount)
                .ThenByDescending(i => i.NotesCount)
                .ToList();
        }

        public async Task<List<InterestGardenResponse>> GetGardensByInterestAsync(string interest, Guid? currentUserId)
        {
            if (string.IsNullOrWhiteSpace(interest))
                throw new Exception("Interest cannot be empty");

            var normalizedInterest = interest.ToLower().Trim();

            // Find all tags that match this interest
            var matchingTags = await _db.Tags
                .Where(t => t.Name == normalizedInterest)
                .Include(t => t.NoteTags)
                    .ThenInclude(nt => nt.Note)
                .ToListAsync();

            if (!matchingTags.Any())
                return new List<InterestGardenResponse>();

            // Get unique user IDs who have this interest
            var userIdsWithInterest = matchingTags
                .Select(t => t.UserId)
                .Distinct()
                .ToList();

            var gardens = new List<InterestGardenResponse>();

            foreach (var userId in userIdsWithInterest)
            {
                // Skip current user's own garden
                if (currentUserId.HasValue && userId == currentUserId.Value)
                    continue;

                // Get user's garden
                var garden = await _db.Gardens
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.UserId == userId);

                // Only show public gardens
                if (garden == null || garden.Visibility != GardenVisibility.Public)
                    continue;

                // Get public notes count
                var publicNotesCount = await _db.Notes
                    .CountAsync(n => n.UserId == userId && n.Visibility == NoteVisibility.Public);

                // Get notes with this specific interest (public only)
                var userTag = matchingTags.FirstOrDefault(t => t.UserId == userId);
                var notesWithInterest = 0;
                if (userTag != null)
                {
                    notesWithInterest = userTag.NoteTags
                        .Count(nt => nt.Note.Visibility == NoteVisibility.Public);
                }

                // Get other interests (tags) this user has
                var otherInterests = await _db.Tags
                    .Where(t => t.UserId == userId && t.Name != normalizedInterest)
                    .Include(t => t.NoteTags)
                    .OrderByDescending(t => t.NoteTags.Count)
                    .Take(5)
                    .Select(t => t.Name)
                    .ToListAsync();

                // Get last activity
                var lastNote = await _db.Notes
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.LastWateredAt)
                    .FirstOrDefaultAsync();

                gardens.Add(new InterestGardenResponse
                {
                    UserId = userId,
                    Username = garden.User.Username,
                    Bio = garden.Bio,
                    PublicNotesCount = publicNotesCount,
                    NotesWithInterest = notesWithInterest,
                    RelatedInterests = otherInterests,
                    LastActive = lastNote?.LastWateredAt ?? garden.UpdatedAt
                });
            }

            // Sort by most notes with this interest, then by last active
            return gardens
                .OrderByDescending(g => g.NotesWithInterest)
                .ThenByDescending(g => g.LastActive)
                .ToList();
        }
    }
}