namespace EvergreenNotes.Domain.DTO
{
    public class CommentResponse
    {
        public Guid Id { get; set; }
        public Guid NoteId { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}