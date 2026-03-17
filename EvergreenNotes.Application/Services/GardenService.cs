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
            var garden = await GetOrCreateGardenAsync(userId);
            var user = await _db.Users.FindAsync(userId);

            return await BuildGardenResponseAsync(garden, user!, userId, isOwner: true);
        }

        public async Task<GardenGraphResponse> GetMyGardenGraphAsync(Guid userId)
        {
            var tags = await _db.Tags
                .Where(t => t.UserId == userId)
                .Include(t => t.NoteTags)
                .ToListAsync();

            var notes = await _db.Notes
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.LastWateredAt)
                .ToListAsync();

            var noteIds = notes.Select(note => note.Id).ToList();

            var noteTagLinks = await _db.NoteTags
                .Where(link => noteIds.Contains(link.NoteId))
                .Select(link => new { link.NoteId, link.TagId })
                .ToListAsync();

            var noteNodeIds = notes.ToDictionary(note => note.Id, note => $"note-{note.Id:N}");

            var tagNodeIds = tags.ToDictionary(tag => tag.Id, tag => $"tag-{tag.Id:N}");

            var edgeKeys = new HashSet<string>(StringComparer.Ordinal);
            var edges = new List<GardenGraphEdgeResponse>();

            void AddEdge(string source, string target, string type)
            {
                if (source == target)
                {
                    return;
                }

                var first = string.CompareOrdinal(source, target) <= 0 ? source : target;
                var second = string.CompareOrdinal(source, target) <= 0 ? target : source;
                var edgeKey = $"{type}:{first}__{second}";

                if (!edgeKeys.Add(edgeKey))
                {
                    return;
                }

                edges.Add(new GardenGraphEdgeResponse
                {
                    Source = source,
                    Target = target,
                    Type = type
                });
            }

            foreach (var link in noteTagLinks)
            {
                if (!noteNodeIds.TryGetValue(link.NoteId, out var noteNodeId))
                {
                    continue;
                }

                if (!tagNodeIds.TryGetValue(link.TagId, out var tagNodeId))
                {
                    continue;
                }

                AddEdge(noteNodeId, tagNodeId, "note-tag");
            }

            foreach (var tag in tags)
            {
                if (!tag.ParentTagId.HasValue)
                {
                    continue;
                }

                if (!tagNodeIds.TryGetValue(tag.ParentTagId.Value, out var sourceTagNodeId))
                {
                    continue;
                }

                if (!tagNodeIds.TryGetValue(tag.Id, out var targetTagNodeId))
                {
                    continue;
                }

                // ParentTagId is treated as an explicit concept relation, not hierarchy depth.
                AddEdge(sourceTagNodeId, targetTagNodeId, "tag-tag");
            }

            var connectionCountByNodeId = new Dictionary<string, int>(StringComparer.Ordinal);

            void IncrementConnectionCount(string nodeId)
            {
                if (!connectionCountByNodeId.TryAdd(nodeId, 1))
                {
                    connectionCountByNodeId[nodeId] += 1;
                }
            }

            foreach (var edge in edges)
            {
                IncrementConnectionCount(edge.Source);
                IncrementConnectionCount(edge.Target);
            }

            var nodes = new List<GardenGraphNodeResponse>();
            nodes.AddRange(tags.Select(tag => new GardenGraphNodeResponse
            {
                Id = tagNodeIds[tag.Id],
                Label = tag.Name,
                Type = "tag",
                NoteCount = tag.NoteTags.Count,
                ConnectionCount = connectionCountByNodeId.TryGetValue(tagNodeIds[tag.Id], out var count) ? count : 0
            }));

            nodes.AddRange(notes.Select(note => new GardenGraphNodeResponse
            {
                Id = noteNodeIds[note.Id],
                Label = note.Title,
                Type = "note",
                NoteCount = 1,
                ConnectionCount = connectionCountByNodeId.TryGetValue(noteNodeIds[note.Id], out var count) ? count : 0
            }));

            var connectedNodes = nodes
                .Where(node => node.ConnectionCount > 0)
                .OrderByDescending(node => node.ConnectionCount)
                .ThenByDescending(node => node.Type == "tag")
                .ThenBy(node => node.Label)
                .ToList();

            var disconnectedTagNodes = nodes
                .Where(node => node.Type == "tag" && node.ConnectionCount == 0)
                .OrderBy(node => node.Label)
                .ToList();

            var highConnectivitySeeds = connectedNodes
                .Where(node => node.ConnectionCount >= 3)
                .Take(18)
                .Select(node => node.Id)
                .ToList();

            var seedNodeIds = highConnectivitySeeds;

            // Keep sparse graphs explorable: if not enough high-connectivity nodes,
            // fall back to the most connected nodes with at least one edge.
            if (seedNodeIds.Count < 8)
            {
                seedNodeIds = connectedNodes
                    .Concat(disconnectedTagNodes)
                    .Take(18)
                    .Select(node => node.Id)
                    .ToList();
            }

            if (seedNodeIds.Count == 0)
            {
                seedNodeIds = nodes
                    .OrderByDescending(node => node.Type == "tag")
                    .ThenBy(node => node.Label)
                    .Take(12)
                    .Select(node => node.Id)
                    .ToList();
            }

            return new GardenGraphResponse
            {
                SeedNodeIds = seedNodeIds,
                Nodes = nodes,
                Edges = edges
            };
        }

        public async Task<GardenResponse> UpdateMyGardenAsync(Guid userId, UpdateGardenRequest request)
        {
            var garden = await GetOrCreateGardenAsync(userId);

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
                var user = await _db.Users.FindAsync(targetUserId);
                if (user == null) return null;

                garden = await CreateDefaultGardenAsync(targetUserId);
            }

            var isOwner = currentUserId == targetUserId;
            if (!isOwner && garden.Visibility == GardenVisibility.Private)
                return null;

            return await BuildGardenResponseAsync(garden, garden.User, currentUserId, isOwner);
        }

        public async Task<List<ExploreGardensResponse>> ExploreGardensAsync(Guid? currentUserId, string? interest = null)
        {
            var publicGardens = await _db.Gardens
                .Include(g => g.User)
                .Where(g => g.Visibility == GardenVisibility.Public)
                .ToListAsync();

            var results = new List<ExploreGardensResponse>();

            foreach (var garden in publicGardens)
            {
                if (currentUserId.HasValue && garden.UserId == currentUserId.Value)
                    continue;

                var totalNotes = await _db.Notes.CountAsync(n => n.UserId == garden.UserId);
                var publicNotes = await _db.Notes.CountAsync(n => n.UserId == garden.UserId && n.Visibility == NoteVisibility.Public);

                var tags = await _db.Tags
                    .Where(t => t.UserId == garden.UserId)
                    .Include(t => t.NoteTags)
                    .OrderByDescending(t => t.NoteTags.Count)
                    .Take(5)
                    .Select(t => t.Name)
                    .ToListAsync();

                if (!string.IsNullOrWhiteSpace(interest))
                {
                    var normalizedInterest = interest.ToLower().Trim();
                    if (!tags.Any(t => t.Contains(normalizedInterest)))
                        continue;
                }

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

            return results.OrderByDescending(r => r.LastActive).ToList();
        }

        private async Task<Garden> GetOrCreateGardenAsync(Guid userId)
        {
            var garden = await _db.Gardens.FirstOrDefaultAsync(g => g.UserId == userId);

            if (garden == null)
            {
                garden = await CreateDefaultGardenAsync(userId);
            }

            return garden;
        }

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

        private async Task<GardenResponse> BuildGardenResponseAsync(Garden garden, User user, Guid? currentUserId, bool isOwner)
        {
            var userId = garden.UserId;

            var notesQuery = _db.Notes.Where(n => n.UserId == userId);
            if (!isOwner)
                notesQuery = notesQuery.Where(n => n.Visibility == NoteVisibility.Public);

            var notes = await notesQuery.ToListAsync();

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

            var recentNotes = notes
                .OrderByDescending(n => n.LastWateredAt)
                .Take(6)
                .Select(n => MapNoteToResponse(n))
                .ToList();

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
                Tags = new List<string>(),
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