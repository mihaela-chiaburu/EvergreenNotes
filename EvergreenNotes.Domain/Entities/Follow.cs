namespace EvergreenNotes.Domain.Entities
{
    public class Follow
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid FollowerId { get; set; } // User who is following
        public Guid FollowingId { get; set; } // User being followed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User Follower { get; set; } = null!;
        public User Following { get; set; } = null!;
    }
}