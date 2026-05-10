using EvergreenNotes.Application.Services;
using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using EvergreenNotes.Helpers;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace EvergreenNotes.Tests.ServicesTests
{
    public class GardenServiceTests
    {
        [Fact]
        public async Task GetPublicGardenAsync_PrivateGardenNotOwner_ReturnsNull()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"garden-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);

            var ownerId = Guid.NewGuid();
            db.Users.Add(new User { Id = ownerId, Username = "owner", Email = "owner@example.com", PasswordHash = "hash" });
            db.Gardens.Add(new Garden { UserId = ownerId, Visibility = GardenVisibility.Private });
            await db.SaveChangesAsync();

            var service = new GardenService(db);

            // Act
            var result = await service.GetPublicGardenAsync(ownerId, Guid.NewGuid());

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateMyGardenAsync_ValidRequest_UpdatesFields()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"garden-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);

            var userId = Guid.NewGuid();
            db.Users.Add(new User { Id = userId, Username = "maria", Email = "maria@example.com", PasswordHash = "hash" });
            await db.SaveChangesAsync();

            var service = new GardenService(db);
            var request = new UpdateGardenRequest
            {
                Visibility = GardenVisibility.Public,
                Bio = "Notes about wild plants"
            };

            // Act
            var result = await service.UpdateMyGardenAsync(userId, request);

            // Assert
            Assert.Equal(userId, result.UserId);
            Assert.Equal("public", result.Visibility);
            Assert.Equal("Notes about wild plants", result.Bio);
        }
    }

    public class TagServiceTests
    {
        [Fact]
        public async Task CreateTagAsync_EmptyName_ThrowsException()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"tag-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);
            var mockNoteService = new Mock<INoteService>();
            var service = new TagService(db, mockNoteService.Object);

            // Act + Assert
            await Assert.ThrowsAsync<Exception>(() => service.CreateTagAsync(Guid.NewGuid(), "   "));
        }

        [Fact]
        public async Task UpdateTagNameAsync_TagOwnedByAnotherUser_ThrowsException()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"tag-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);

            var ownerId = Guid.NewGuid();
            var tag = new Tag { UserId = ownerId, Name = "Botany", CreatedAt = DateTime.UtcNow };
            db.Tags.Add(tag);
            await db.SaveChangesAsync();

            var mockNoteService = new Mock<INoteService>();
            var service = new TagService(db, mockNoteService.Object);

            // Act + Assert
            await Assert.ThrowsAsync<Exception>(() =>
                service.UpdateTagNameAsync(Guid.NewGuid(), tag.Id, "Plants"));
        }
    }

    public class UserServiceTests
    {
        [Fact]
        public async Task RegisterAsync_NewUser_ReturnsAuthResponse()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"user-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);
            var service = new UserService(db);

            var request = new RegisterRequest
            {
                Username = "alex",
                Email = "alex@example.com",
                Password = "StrongPassword123!"
            };

            // Act
            var result = await service.RegisterAsync(request);

            // Assert
            Assert.Equal(request.Username, result.Username);
            Assert.Equal(request.Email, result.Email);
            Assert.NotNull(result.Token);
            Assert.Single(db.Users);
        }

        [Fact]
        public async Task LoginAsync_InvalidPassword_ThrowsException()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"user-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);
            var service = new UserService(db);

            var user = new User
            {
                Username = "alex",
                Email = "alex@example.com",
                PasswordHash = PasswordHelper.HashPassword("correct-password")
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var request = new LoginRequest
            {
                Email = "alex@example.com",
                Password = "wrong-password"
            };

            // Act + Assert
            await Assert.ThrowsAsync<Exception>(() => service.LoginAsync(request));
        }
    }
}
