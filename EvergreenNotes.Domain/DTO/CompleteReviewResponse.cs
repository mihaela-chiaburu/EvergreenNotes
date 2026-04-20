namespace EvergreenNotes.Domain.DTO
{
    public class CompleteReviewResponse
    {
        public Guid NoteId { get; set; }
        public DateTime LastReviewedAt { get; set; }
        public DateTime NextReviewAt { get; set; }
        public int ReviewCount { get; set; }
        public int ReviewIntervalDays { get; set; }
    }
}
