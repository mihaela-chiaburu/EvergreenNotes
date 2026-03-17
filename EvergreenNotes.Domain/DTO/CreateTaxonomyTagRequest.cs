namespace EvergreenNotes.Domain.DTO
{
    public class CreateTaxonomyTagRequest
    {
        public string Name { get; set; } = string.Empty;
        public Guid? ParentTagId { get; set; }
    }
}
