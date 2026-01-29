using EvergreenNotes.Domain.DTO;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface ISocialService
    {
        // Follow
        Task FollowUserAsync(Guid followerId, Guid followingId);
        Task UnfollowUserAsync(Guid followerId, Guid followingId);
        Task<List<FollowResponse>> GetFollowingAsync(Guid userId);

        // Comments
        Task<CommentResponse> AddCommentAsync(Guid userId, Guid noteId, string content);
        Task<List<CommentResponse>> GetCommentsAsync(Guid noteId, Guid? currentUserId);
    }
}