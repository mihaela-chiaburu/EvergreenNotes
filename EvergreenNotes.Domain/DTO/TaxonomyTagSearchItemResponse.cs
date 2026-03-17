namespace EvergreenNotes.Domain.DTO
{
    public class TaxonomyTagSearchItemResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public Guid? ParentTagId { get; set; }
        public int Depth { get; set; }
    }
}
