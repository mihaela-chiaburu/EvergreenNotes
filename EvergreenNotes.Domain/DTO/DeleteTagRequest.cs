namespace EvergreenNotes.Domain.DTO
{
    public class DeleteTagRequest
    {
        public string? MoveNotesToTagId { get; set; }
        public bool CascadeDeleteNotes { get; set; }
    }
}