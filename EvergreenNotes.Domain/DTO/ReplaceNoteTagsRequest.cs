namespace EvergreenNotes.Domain.DTO
{
    public class ReplaceNoteTagsRequest
    {
        public List<string> TagNames { get; set; } = new();
    }
}
