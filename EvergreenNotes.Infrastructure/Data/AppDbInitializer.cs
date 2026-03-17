using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Helpers;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Infrastructure.Data
{
    public static class AppDbInitializer
    {
        public static readonly Guid DemoUserId = Guid.Parse("179F06C5-9F63-4695-B55F-8321DCE5815C");

        public static async Task InitializeAsync(AppDbContext db)
        {
            await db.Database.MigrateAsync();
            await EnsureTaxonomyColumnAsync(db);
            await SeedDemoUserAsync(db);
        }

        private static async Task EnsureTaxonomyColumnAsync(AppDbContext db)
        {
            await db.Database.ExecuteSqlRawAsync(@"
IF COL_LENGTH('Tags', 'ParentTagId') IS NULL
BEGIN
    ALTER TABLE [Tags] ADD [ParentTagId] uniqueidentifier NULL;
END");

            await db.Database.ExecuteSqlRawAsync(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Tags_ParentTagId' AND object_id = OBJECT_ID('Tags')
)
BEGIN
    CREATE INDEX [IX_Tags_ParentTagId] ON [Tags]([ParentTagId]);
END");
        }

        private static async Task SeedDemoUserAsync(AppDbContext db)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == DemoUserId);
            if (user == null)
            {
                user = new User
                {
                    Id = DemoUserId,
                    Username = "Mihaela",
                    Email = "mihaela.bloom@gmail.com",
                    PasswordHash = PasswordHelper.HashPassword("Password123!"),
                    CreatedAt = DateTime.UtcNow.AddMonths(-4)
                };

                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            var garden = await db.Gardens.FirstOrDefaultAsync(g => g.UserId == DemoUserId);
            if (garden == null)
            {
                db.Gardens.Add(new Garden
                {
                    UserId = DemoUserId,
                    Bio = "Growing quietly, one note at a time.",
                    Visibility = GardenVisibility.Public,
                    DefaultViewType = GardenViewType.Graph,
                    GardenTheme = "forest",
                    CreatedAt = DateTime.UtcNow.AddMonths(-3),
                    UpdatedAt = DateTime.UtcNow
                });
            }

            if (await db.Notes.AnyAsync(n => n.UserId == DemoUserId))
            {
                await db.SaveChangesAsync();
                return;
            }

            var notes = new List<Note>
            {
                new()
                {
                    Id = Guid.Parse("5E7B01EC-8D77-4C49-B270-702ACF6A4101"),
                    UserId = DemoUserId,
                    Title = "Map the project direction",
                    Content = "Drafted the main milestones and linked each idea to one concrete next action.",
                    SourceType = "Project Planning Sync",
                    Status = NoteStatus.Polished,
                    Visibility = NoteVisibility.Public,
                    CreatedAt = DateTime.UtcNow.AddDays(-100),
                    LastWateredAt = DateTime.UtcNow.AddDays(-8)
                },
                new()
                {
                    Id = Guid.Parse("A94D7A5E-23A0-47B8-97DA-9CF39DFD31A0"),
                    UserId = DemoUserId,
                    Title = "Refactor auth notes",
                    Content = "The login flow works, but error handling and reset states still need cleanup.",
                    SourceType = "Auth cleanup board",
                    Status = NoteStatus.Rough,
                    Visibility = NoteVisibility.Private,
                    CreatedAt = DateTime.UtcNow.AddDays(-92),
                    LastWateredAt = DateTime.UtcNow.AddDays(-12)
                },
                new()
                {
                    Id = Guid.Parse("2E19967E-54D2-448A-A5B6-1847EB63295B"),
                    UserId = DemoUserId,
                    Title = "Garden graph observations",
                    Content = "Users understand connections quickly when labels are short and high-contrast.",
                    SourceType = "UX experiment notes",
                    Status = NoteStatus.Rough,
                    Visibility = NoteVisibility.Public,
                    CreatedAt = DateTime.UtcNow.AddDays(-85),
                    LastWateredAt = DateTime.UtcNow.AddDays(-20)
                },
                new()
                {
                    Id = Guid.Parse("2FA9AF87-CA75-4C75-915E-B7F6A4150C56"),
                    UserId = DemoUserId,
                    Title = "Content pattern ideas",
                    Content = "Created a reusable note structure with context, insight, and action sections.",
                    SourceType = "Writing session",
                    Status = NoteStatus.Polished,
                    Visibility = NoteVisibility.Public,
                    CreatedAt = DateTime.UtcNow.AddDays(-78),
                    LastWateredAt = DateTime.UtcNow.AddDays(-5)
                },
                new()
                {
                    Id = Guid.Parse("7A16B6F7-79E2-404B-9EE7-8EB1D4A3D20C"),
                    UserId = DemoUserId,
                    Title = "Tag strategy",
                    Content = "Reduced redundant tags and grouped similar concepts under a shared parent label.",
                    SourceType = "Taxonomy workshop",
                    Status = NoteStatus.Polished,
                    Visibility = NoteVisibility.Public,
                    CreatedAt = DateTime.UtcNow.AddDays(-72),
                    LastWateredAt = DateTime.UtcNow.AddDays(-2)
                },
                new()
                {
                    Id = Guid.Parse("47AE98DD-C4FC-4C03-AE5A-47169647EECD"),
                    UserId = DemoUserId,
                    Title = "Review backlog",
                    Content = "Several old notes are still valuable, but they need updated links and examples.",
                    SourceType = "Weekly review",
                    Status = NoteStatus.Rough,
                    Visibility = NoteVisibility.Private,
                    CreatedAt = DateTime.UtcNow.AddDays(-66),
                    LastWateredAt = DateTime.UtcNow.AddDays(-30)
                }
            };

            db.Notes.AddRange(notes);
            await db.SaveChangesAsync();

            var tagByName = new Dictionary<string, Tag>(StringComparer.OrdinalIgnoreCase);

            async Task<Tag> EnsureTagAsync(string name, string? parentName = null)
            {
                var normalized = name.Trim();
                if (tagByName.TryGetValue(normalized, out var cached))
                {
                    return cached;
                }

                Guid? parentId = null;
                if (!string.IsNullOrWhiteSpace(parentName))
                {
                    var parentTag = await EnsureTagAsync(parentName);
                    parentId = parentTag.Id;
                }

                var existing = await db.Tags.FirstOrDefaultAsync(t =>
                    t.UserId == DemoUserId &&
                    t.ParentTagId == parentId &&
                    t.Name.ToLower() == normalized.ToLower());

                var created = existing ?? new Tag
                {
                    Id = Guid.NewGuid(),
                    UserId = DemoUserId,
                    Name = normalized,
                    ParentTagId = parentId,
                    CreatedAt = DateTime.UtcNow
                };

                if (existing == null)
                {
                    db.Tags.Add(created);
                    await db.SaveChangesAsync();
                }

                tagByName[normalized] = created;
                return created;
            }

            await EnsureTagAsync("Planning");
            await EnsureTagAsync("Research");
            await EnsureTagAsync("Roadmap");
            await EnsureTagAsync("React");
            await EnsureTagAsync("Auth");
            await EnsureTagAsync("UX");
            await EnsureTagAsync("Graph");
            await EnsureTagAsync("Nodes");
            await EnsureTagAsync("Writing");
            await EnsureTagAsync("Templates");
            await EnsureTagAsync("Taxonomy");
            await EnsureTagAsync("Tags");
            await EnsureTagAsync("Backlog");
            await EnsureTagAsync("Priority");
            await EnsureTagAsync("Philosophy");
            await EnsureTagAsync("Stoicism", "Philosophy");

            var noteTagMap = new Dictionary<Guid, string[]>
            {
                [notes[0].Id] = new[] { "Planning", "Research", "Roadmap" },
                [notes[1].Id] = new[] { "React", "Auth" },
                [notes[2].Id] = new[] { "UX", "Graph", "Nodes" },
                [notes[3].Id] = new[] { "Writing", "Templates" },
                [notes[4].Id] = new[] { "Taxonomy", "Tags", "Philosophy > Stoicism" },
                [notes[5].Id] = new[] { "Backlog", "Priority" }
            };

            var existingLinks = await db.NoteTags.Where(nt => nt.Note.UserId == DemoUserId).ToListAsync();
            db.NoteTags.RemoveRange(existingLinks);
            await db.SaveChangesAsync();

            foreach (var (noteId, rawTags) in noteTagMap)
            {
                foreach (var rawTag in rawTags)
                {
                    var segments = rawTag.Split('>').Select(segment => segment.Trim()).Where(segment => segment.Length > 0).ToList();
                    if (segments.Count == 0)
                    {
                        continue;
                    }

                    Tag? current = null;
                    foreach (var segment in segments)
                    {
                        current = await EnsureTagAsync(segment, current?.Name);
                    }

                    if (current == null)
                    {
                        continue;
                    }

                    db.NoteTags.Add(new NoteTag
                    {
                        NoteId = noteId,
                        TagId = current.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await db.SaveChangesAsync();
        }
    }
}
