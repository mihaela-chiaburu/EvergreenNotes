using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class GardenService : IGardenService
    {
        private readonly AppDbContext _db;

        public GardenService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<GardenResponse> GetMyGardenAsync(Guid userId)
        {
            // Get or create garden
            var garden = await GetOrCreateGardenAsync(userId);
            var user = await _db.Users.FindAsync(userId);

            return await BuildGardenResponseAsync(garden, user!, userId, isOwner: true);
        }

        public async Task<GardenResponse> UpdateMyGardenAsync(Guid userId, UpdateGardenRequest request)
        {
            var garden = await GetOrCreateGardenAsync(userId);

            // Update fields
            if (request.Visibility.HasValue)
                garden.Visibility = request.Visibility.Value;

            if (request.DefaultViewType.HasValue)
                garden.DefaultViewType = request.DefaultViewType.Value;

            if (request.GardenTheme != null)
                garden.GardenTheme = request.GardenTheme;

            if (request.Bio != null)
                garden.Bio = request.Bio;

            garden.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);
            return await BuildGardenResponseAsync(garden, user!, userId, isOwner: true);
        }

        public async Task<GardenResponse?> GetPublicGardenAsync(Guid targetUserId, Guid? currentUserId)
        {
            var garden = await _db.Gardens
                .Include(g => g.User)
                .FirstOrDefaultAsync(g => g.UserId == targetUserId);

            if (garden == null)
            {
                // Create default garden if user exists
                var user = await _db.Users.FindAsync(targetUserId);
                if (user == null) return null;

                garden = await CreateDefaultGardenAsync(targetUserId);
            }

            // Check visibility permissions
            var isOwner = currentUserId == targetUserId;
            if (!isOwner && garden.Visibility == GardenVisibility.Private)
                return null;

            return await BuildGardenResponseAsync(garden, garden.User, currentUserId, isOwner);
        }

        public async Task<List<ExploreGardensResponse>> ExploreGardensAsync(Guid? currentUserId, string? interest = null)
        {
            // Get all public gardens
            var publicGardens = await _db.Gardens
                .Include(g => g.User)
                .Where(g => g.Visibility == GardenVisibility.Public)
                .ToListAsync();

            var results = new List<ExploreGardensResponse>();

            foreach (var garden in publicGardens)
            {
                // Skip own garden
                if (currentUserId.HasValue && garden.UserId == currentUserId.Value)
                    continue;

                // Get user's notes count
                var totalNotes = await _db.Notes.CountAsync(n => n.UserId == garden.UserId);
                var publicNotes = await _db.Notes.CountAsync(n => n.UserId == garden.UserId && n.Visibility == NoteVisibility.Public);

                // Get user's interests (tags)
                var tags = await _db.Tags
                    .Where(t => t.UserId == garden.UserId)
                    .Include(t => t.NoteTags)
                    .OrderByDescending(t => t.NoteTags.Count)
                    .Take(5)
                    .Select(t => t.Name)
                    .ToListAsync();

                // Filter by interest if provided
                if (!string.IsNullOrWhiteSpace(interest))
                {
                    var normalizedInterest = interest.ToLower().Trim();
                    if (!tags.Any(t => t.Contains(normalizedInterest)))
                        continue;
                }

                // Get last activity
                var lastNote = await _db.Notes
                    .Where(n => n.UserId == garden.UserId)
                    .OrderByDescending(n => n.LastWateredAt)
                    .FirstOrDefaultAsync();

                results.Add(new ExploreGardensResponse
                {
                    UserId = garden.UserId,
                    Username = garden.User.Username,
                    Bio = garden.Bio,
                    TotalNotes = totalNotes,
                    PublicNotes = publicNotes,
                    Interests = tags,
                    LastActive = lastNote?.LastWateredAt ?? garden.UpdatedAt
                });
            }

            // Sort by last active
            return results.OrderByDescending(r => r.LastActive).ToList();
        }

        // Helper: Get or create garden for user
        private async Task<Garden> GetOrCreateGardenAsync(Guid userId)
        {
            var garden = await _db.Gardens.FirstOrDefaultAsync(g => g.UserId == userId);

            if (garden == null)
            {
                garden = await CreateDefaultGardenAsync(userId);
            }

            return garden;
        }

        // Helper: Create default garden
        private async Task<Garden> CreateDefaultGardenAsync(Guid userId)
        {
            var garden = new Garden
            {
                UserId = userId,
                Visibility = GardenVisibility.Private,
                DefaultViewType = GardenViewType.Garden,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Gardens.Add(garden);
            await _db.SaveChangesAsync();

            return garden;
        }

        // Helper: Build full garden response with statistics
        private async Task<GardenResponse> BuildGardenResponseAsync(Garden garden, User user, Guid? currentUserId, bool isOwner)
        {
            var userId = garden.UserId;

            // Get notes (all for owner, only public for others)
            var notesQuery = _db.Notes.Where(n => n.UserId == userId);
            if (!isOwner)
                notesQuery = notesQuery.Where(n => n.Visibility == NoteVisibility.Public);

            var notes = await notesQuery.ToListAsync();

            // Calculate plant health distribution
            var freshCount = 0;
            var healthyCount = 0;
            var paleCount = 0;
            var dryCount = 0;

            foreach (var note in notes)
            {
                var daysSinceWatered = (DateTime.UtcNow - note.LastWateredAt).Days;
                if (daysSinceWatered <= 2) freshCount++;
                else if (daysSinceWatered <= 7) healthyCount++;
                else if (daysSinceWatered <= 14) paleCount++;
                else dryCount++;
            }

            // Get recent notes
            var recentNotes = notes
                .OrderByDescending(n => n.LastWateredAt)
                .Take(6)
                .Select(n => MapNoteToResponse(n))
                .ToList();

            // Get top tags
            var topTags = await _db.Tags
                .Where(t => t.UserId == userId)
                .Include(t => t.NoteTags)
                .OrderByDescending(t => t.NoteTags.Count)
                .Take(10)
                .Select(t => new TagResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    CreatedAt = t.CreatedAt,
                    NoteCount = t.NoteTags.Count
                })
                .ToListAsync();

            // Get connections count
            var connectionsCount = await _db.Connections.CountAsync(c => c.UserId == userId);
            var tagsCount = await _db.Tags.CountAsync(t => t.UserId == userId);

            return new GardenResponse
            {
                Id = garden.Id,
                UserId = garden.UserId,
                Username = user.Username,
                Visibility = garden.Visibility.ToString().ToLower(),
                DefaultViewType = garden.DefaultViewType.ToString().ToLower(),
                GardenTheme = garden.GardenTheme,
                Bio = garden.Bio,
                TotalNotes = notes.Count,
                PublicNotes = notes.Count(n => n.Visibility == NoteVisibility.Public),
                Connections = connectionsCount,
                Tags = tagsCount,
                FreshNotes = freshCount,
                HealthyNotes = healthyCount,
                PaleNotes = paleCount,
                DryNotes = dryCount,
                RecentNotes = recentNotes,
                TopTags = topTags,
                CreatedAt = garden.CreatedAt,
                UpdatedAt = garden.UpdatedAt
            };
        }

        // Helper: Map Note to NoteResponse
        private NoteResponse MapNoteToResponse(Note note)
        {
            var daysSinceWatered = (DateTime.UtcNow - note.LastWateredAt).Days;
            PlantState plantState;

            if (daysSinceWatered <= 2) plantState = PlantState.Fresh;
            else if (daysSinceWatered <= 7) plantState = PlantState.Healthy;
            else if (daysSinceWatered <= 14) plantState = PlantState.Pale;
            else plantState = PlantState.Dry;

            return new NoteResponse
            {
                Id = note.Id,
                UserId = note.UserId,
                Title = note.Title,
                Content = note.Content,
                Status = note.Status.ToString().ToLower(),
                Visibility = note.Visibility.ToString().ToLower(),
                PlantState = plantState.ToString().ToLower(),
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