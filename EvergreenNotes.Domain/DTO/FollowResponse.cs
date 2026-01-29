namespace EvergreenNotes.Domain.DTO
{
    public class FollowResponse
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int PublicNotesCount { get; set; }
        public DateTime FollowedAt { get; set; }
    }
}