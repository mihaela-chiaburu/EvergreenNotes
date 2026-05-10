using System.ComponentModel.DataAnnotations;
using System.Linq;
using EvergreenNotes.Application.Services;
using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace EvergreenNotes.Tests.ServicesTests
{
    public class NoteServiceTests
    {
        [Fact]
        public async Task CreateNoteAsync_ValidRequest_ReturnsNoteResponse()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"notes-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);
            var mockQuestionGenerator = new Mock<IReviewQuestionGenerator>();
            var service = new NoteService(db, mockQuestionGenerator.Object);

            var userId = Guid.NewGuid();
            var request = new CreateNoteRequest
            {
                Title = "Understanding trees",
                Content = "Short, clean content for the test."
            };

            // Act
            var result = await service.CreateNoteAsync(userId, request);

            // Assert
            Assert.Equal(userId, result.UserId);
            Assert.Equal(request.Title, result.Title);
            Assert.Single(db.Notes);
        }

        [Fact]
        public async Task CreateNoteAsync_EmptyTitle_ThrowsValidationException()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"notes-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);
            var mockQuestionGenerator = new Mock<IReviewQuestionGenerator>();
            var service = new NoteService(db, mockQuestionGenerator.Object);

            var request = new CreateNoteRequest
            {
                Title = " ",
                Content = "Any content"
            };

            // Act + Assert
            await Assert.ThrowsAsync<ValidationException>(() => service.CreateNoteAsync(Guid.NewGuid(), request));
        }
    }

    public class SearchServiceTests
    {
        [Fact]
        public async Task SearchNotesAsync_QueryProvided_ReturnsOnlyMatchingNotes()
        {
            // Arrange
            var gardenUserId = Guid.NewGuid();
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase($"notes-db-{Guid.NewGuid()}")
                .Options;
            using var db = new AppDbContext(options);

            db.Notes.AddRange(
                new Note
                {
                    UserId = gardenUserId,
                    Title = "Forest basics",
                    Content = "Light and soil",
                    NoteTags = new List<NoteTag>()
                },
                new Note
                {
                    UserId = gardenUserId,
                    Title = "Garden tips",
                    Content = "Forest floor ecology",
                    NoteTags = new List<NoteTag>()
                },
                new Note
                {
                    UserId = gardenUserId,
                    Title = "Unrelated",
                    Content = "Nothing about keywords",
                    NoteTags = new List<NoteTag>()
                });
            await db.SaveChangesAsync();

            var service = new SearchService(db);

            // Act
            var results = await service.SearchNotesAsync(gardenUserId, gardenUserId, "forest");

            // Assert
            Assert.Equal(2, results.Count);
            Assert.All(results, result =>
                Assert.Contains("forest", (result.Title + " " + result.Content).ToLower()));
        }
    }

}
