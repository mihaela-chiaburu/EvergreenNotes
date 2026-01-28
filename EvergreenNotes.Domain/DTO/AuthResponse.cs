namespace EvergreenNotes.Domain.DTO
{
    public class AuthResponse
    {
        public required string Token { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
    }

}
