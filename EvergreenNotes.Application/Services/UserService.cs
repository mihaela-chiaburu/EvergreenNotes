using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Helpers;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;


namespace EvergreenNotes.Application.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
         
        public UserService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            if (await _db.Users.AnyAsync(u => u.Email == request.Email))
                throw new Exception("Email already registered.");

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = PasswordHelper.HashPassword(request.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            string token = JwtHelper.GenerateToken(user);

            return new AuthResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !PasswordHelper.VerifyPassword(request.Password, user.PasswordHash))
                throw new Exception("Invalid credentials.");

            string token = JwtHelper.GenerateToken(user);

            return new AuthResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email
            };
        }

        public async Task<User?> GetMeAsync(Guid userId)
        {
            return await _db.Users.FindAsync(userId);
        }
    }
}
