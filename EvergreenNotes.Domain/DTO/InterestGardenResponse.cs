namespace EvergreenNotes.Domain.DTO
{
    public class InterestGardenResponse
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int PublicNotesCount { get; set; }
        public int NotesWithInterest { get; set; } // How many notes they have with this specific interest
        public List<string> RelatedInterests { get; set; } = new List<string>(); // Other interests this user has
        public DateTime LastActive { get; set; }
    }
}