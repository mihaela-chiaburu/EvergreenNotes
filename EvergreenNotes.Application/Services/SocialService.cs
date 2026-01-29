using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class SocialService : ISocialService
    {
        private readonly AppDbContext _db;

        public SocialService(AppDbContext db)
        {
            _db = db;
        }

        // ========== FOLLOW FEATURES ==========

        public async Task FollowUserAsync(Guid followerId, Guid followingId)
        {
            // Prevent self-follow
            if (followerId == followingId)
                throw new Exception("Cannot follow yourself");

            // Check if user to follow exists
            var userToFollow = await _db.Users.FindAsync(followingId);
            if (userToFollow == null)
                throw new Exception("User not found");

            // Check if already following
            var existingFollow = await _db.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

            if (existingFollow != null)
                throw new Exception("Already following this user");

            // Create follow relationship
            var follow = new Follow
            {
                FollowerId = followerId,
                FollowingId = followingId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Follows.Add(follow);
            await _db.SaveChangesAsync();
        }

        public async Task UnfollowUserAsync(Guid followerId, Guid followingId)
        {
            var follow = await _db.Follows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

            if (follow == null)
                throw new Exception("Not following this user");

            _db.Follows.Remove(follow);
            await _db.SaveChangesAsync();
        }

        public async Task<List<FollowResponse>> GetFollowingAsync(Guid userId)
        {
            var follows = await _db.Follows
                .Where(f => f.FollowerId == userId)
                .Include(f => f.Following)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            var results = new List<FollowResponse>();

            foreach (var follow in follows)
            {
                // Get garden bio
                var garden = await _db.Gardens.FirstOrDefaultAsync(g => g.UserId == follow.FollowingId);

                // Get public notes count
                var publicNotesCount = await _db.Notes
                    .CountAsync(n => n.UserId == follow.FollowingId && n.Visibility == NoteVisibility.Public);

                results.Add(new FollowResponse
                {
                    UserId = follow.FollowingId,
                    Username = follow.Following.Username,
                    Bio = garden?.Bio,
                    PublicNotesCount = publicNotesCount,
                    FollowedAt = follow.CreatedAt
                });
            }

            return results;
        }

        // ========== COMMENT FEATURES ==========

        public async Task<CommentResponse> AddCommentAsync(Guid userId, Guid noteId, string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new Exception("Comment content cannot be empty");

            // Verify note exists and is public
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null)
                throw new Exception("Note not found");

            if (note.Visibility != NoteVisibility.Public)
                throw new Exception("Can only comment on public notes");

            // Create comment
            var comment = new Comment
            {
                NoteId = noteId,
                UserId = userId,
                Content = content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.Comments.Add(comment);
            await _db.SaveChangesAsync();

            // Get user info for response
            var user = await _db.Users.FindAsync(userId);

            return new CommentResponse
            {
                Id = comment.Id,
                NoteId = comment.NoteId,
                UserId = comment.UserId,
                Username = user!.Username,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<List<CommentResponse>> GetCommentsAsync(Guid noteId, Guid? currentUserId)
        {
            // Verify note exists and check visibility
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null)
                throw new Exception("Note not found");

            // Only allow viewing comments on public notes or own notes
            if (note.Visibility != NoteVisibility.Public && note.UserId != currentUserId)
                throw new Exception("Cannot view comments on private notes");

            var comments = await _db.Comments
                .Where(c => c.NoteId == noteId)
                .Include(c => c.User)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return comments.Select(c => new CommentResponse
            {
                Id = c.Id,
                NoteId = c.NoteId,
                UserId = c.UserId,
                Username = c.User.Username,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
        }
    }
}