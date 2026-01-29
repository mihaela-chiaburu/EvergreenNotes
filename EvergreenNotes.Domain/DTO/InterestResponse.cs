namespace EvergreenNotes.Domain.DTO
{
    public class InterestResponse
    {
        public string Name { get; set; } = string.Empty;
        public int UsersCount { get; set; } // How many users have this interest
        public int NotesCount { get; set; } // Total notes with this tag across all users
        public bool IsPopular { get; set; } // True if > 5 users have this interest
    }
}