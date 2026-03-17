namespace EvergreenNotes.Domain.DTO
{
    public class TaxonomyTagNodeResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public Guid? ParentTagId { get; set; }
        public int Depth { get; set; }
        public int NotesCount { get; set; }
        public List<TaxonomyTagNodeResponse> Children { get; set; } = new();
    }
}
