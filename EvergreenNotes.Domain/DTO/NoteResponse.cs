using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class NoteResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; 
        public string Visibility { get; set; } = string.Empty; 
        public string PlantState { get; set; } = string.Empty; 
        public string? SourceUrl { get; set; }
        public string? SourceType { get; set; }
        public string? SourceThumbnail { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastWateredAt { get; set; }
        public int DaysSinceWatered { get; set; }
    }
}
