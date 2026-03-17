namespace EvergreenNotes.Domain.DTO
{
    public class GardenGraphNodeResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int NoteCount { get; set; }
        public int ConnectionCount { get; set; }
    }
}
