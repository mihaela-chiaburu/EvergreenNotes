namespace EvergreenNotes.Domain.DTO
{
    public class ReviewQuestionResponse
    {
        public Guid NoteId { get; set; }
        public string Question { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
    }
}
