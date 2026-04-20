namespace EvergreenNotes.Domain.DTO
{
    public class GardenCareQueueResponse
    {
        public DateTime GeneratedAt { get; set; }
        public int TotalNotes { get; set; }
        public int DueTodayCount { get; set; }
        public int GrowingCount { get; set; }
        public int ReviewStreakDays { get; set; }
        public List<DueReviewNoteResponse> ReadyForReflection { get; set; } = new();
        public List<GrowingReviewNoteResponse> Growing { get; set; } = new();
    }

    public class DueReviewNoteResponse
    {
        public Guid NoteId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public DateTime LastReviewedAt { get; set; }
        public DateTime NextReviewAt { get; set; }
        public int ReviewIntervalDays { get; set; }
        public string Question { get; set; } = string.Empty;
    }

    public class GrowingReviewNoteResponse
    {
        public Guid NoteId { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public DateTime LastReviewedAt { get; set; }
        public DateTime NextReviewAt { get; set; }
        public int DaysUntilReview { get; set; }
        public int ReviewIntervalDays { get; set; }
    }
}
