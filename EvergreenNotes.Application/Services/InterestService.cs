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
            var allTags = await _db.Tags
                .Include(t => t.NoteTags)
                .ToListAsync();

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
                var usersWithTag = group.Tags
                    .Select(t => t.UserId)
                    .Distinct()
                    .Count();

                var totalNotes = group.Tags
                    .Sum(t => t.NoteTags.Count);

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

            var matchingTags = await _db.Tags
                .Where(t => t.Name == normalizedInterest)
                .Include(t => t.NoteTags)
                    .ThenInclude(nt => nt.Note)
                .ToListAsync();

            if (!matchingTags.Any())
                return new List<InterestGardenResponse>();

            var userIdsWithInterest = matchingTags
                .Select(t => t.UserId)
                .Distinct()
                .ToList();

            var gardens = new List<InterestGardenResponse>();

            foreach (var userId in userIdsWithInterest)
            {
                if (currentUserId.HasValue && userId == currentUserId.Value)
                    continue;

                var garden = await _db.Gardens
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.UserId == userId);

                if (garden == null || garden.Visibility != GardenVisibility.Public)
                    continue;

                var publicNotesCount = await _db.Notes
                    .CountAsync(n => n.UserId == userId && n.Visibility == NoteVisibility.Public && !n.IsDeleted);

                var userTag = matchingTags.FirstOrDefault(t => t.UserId == userId);
                var notesWithInterest = 0;
                if (userTag != null)
                {
                    notesWithInterest = userTag.NoteTags
                        .Count(nt => nt.Note.Visibility == NoteVisibility.Public && !nt.Note.IsDeleted);
                }

                var otherInterests = await _db.Tags
                    .Where(t => t.UserId == userId && t.Name != normalizedInterest)
                    .Include(t => t.NoteTags)
                    .OrderByDescending(t => t.NoteTags.Count)
                    .Take(5)
                    .Select(t => t.Name)
                    .ToListAsync();

                var lastNote = await _db.Notes
                    .Where(n => n.UserId == userId && !n.IsDeleted)
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

            return gardens
                .OrderByDescending(g => g.NotesWithInterest)
                .ThenByDescending(g => g.LastActive)
                .ToList();
        }
    }
}