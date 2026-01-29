using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Entities
{
    public class Note
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        public NoteStatus Status { get; set; } = NoteStatus.Rough;

        public NoteVisibility Visibility { get; set; } = NoteVisibility.Private;

        public PlantState PlantState { get; set; } = PlantState.Fresh;

        public string? SourceUrl { get; set; }
        public string? SourceType { get; set; } 
        public string? SourceThumbnail { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastWateredAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public ICollection<NoteTag> NoteTags { get; set; } = new List<NoteTag>();
    }

    public enum NoteStatus
    {
        Rough = 0,
        Polished = 1
    }

    public enum NoteVisibility
    {
        Private = 0,
        Public = 1
    }

    public enum PlantState
    {
        Fresh = 0,      // 0-2 days
        Healthy = 1,    // 3-7 days
        Pale = 2,       // 8-14 days
        Dry = 3         // 15+ days
    }
}