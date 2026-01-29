namespace EvergreenNotes.Domain.DTO
{
    public class ExploreGardensResponse
    {
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public int TotalNotes { get; set; }
        public int PublicNotes { get; set; }
        public List<string> Interests { get; set; } = new List<string>();
        public DateTime LastActive { get; set; }
    }
}