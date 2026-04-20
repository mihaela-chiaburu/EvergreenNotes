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
        public List<string> Tags { get; set; } = new();
        public string? SourceUrl { get; set; }
        public string? SourceType { get; set; }
        public string? SourceThumbnail { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastWateredAt { get; set; }
        public DateTime LastReviewedAt { get; set; }
        public DateTime NextReviewAt { get; set; }
        public int ReviewCount { get; set; }
        public int CurrentReviewIntervalDays { get; set; }
        public string? CachedReviewQuestion { get; set; }
        public DateTime? CachedReviewQuestionGeneratedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public int DaysSinceWatered { get; set; }
    }
}
