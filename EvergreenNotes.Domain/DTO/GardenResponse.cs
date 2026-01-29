using EvergreenNotes.Domain.Entities;

namespace EvergreenNotes.Domain.DTO
{
    public class GardenResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Visibility { get; set; } = string.Empty;
        public string DefaultViewType { get; set; } = string.Empty;
        public string? GardenTheme { get; set; }
        public string? Bio { get; set; }

        // Statistics
        public int TotalNotes { get; set; }
        public int PublicNotes { get; set; }
        public int Connections { get; set; }
        public int Tags { get; set; }

        // Plant health distribution
        public int FreshNotes { get; set; }
        public int HealthyNotes { get; set; }
        public int PaleNotes { get; set; }
        public int DryNotes { get; set; }

        // Recent activity
        public List<NoteResponse> RecentNotes { get; set; } = new List<NoteResponse>();
        public List<TagResponse> TopTags { get; set; } = new List<TagResponse>();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}