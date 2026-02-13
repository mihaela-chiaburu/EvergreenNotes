using EvergreenNotes.Domain.DTO;
using EvergreenNotes.Domain.Entities;
using EvergreenNotes.Domain.Interfaces;
using EvergreenNotes.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EvergreenNotes.Application.Services
{
    public class ConnectionService : IConnectionService
    {
        private readonly AppDbContext _db;
        private readonly INoteService _noteService;

        public ConnectionService(AppDbContext db, INoteService noteService)
        {
            _db = db;
            _noteService = noteService;
        }

        public async Task<ConnectionResponse> CreateConnectionAsync(Guid userId, Guid sourceNoteId, Guid targetNoteId)
        {
            var sourceNote = await _db.Notes.FindAsync(sourceNoteId);
            var targetNote = await _db.Notes.FindAsync(targetNoteId);

            if (sourceNote == null || sourceNote.UserId != userId)
                throw new Exception("Source note not found or access denied");

            if (targetNote == null || targetNote.UserId != userId)
                throw new Exception("Target note not found or access denied");

            var existingConnection = await _db.Connections
                .FirstOrDefaultAsync(c =>
                    (c.SourceNoteId == sourceNoteId && c.TargetNoteId == targetNoteId) ||
                    (c.SourceNoteId == targetNoteId && c.TargetNoteId == sourceNoteId));

            if (existingConnection != null)
                throw new Exception("Connection already exists between these notes");

            if (sourceNoteId == targetNoteId)
                throw new Exception("Cannot connect a note to itself");

            var connection = new Connection
            {
                SourceNoteId = sourceNoteId,
                TargetNoteId = targetNoteId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Connections.Add(connection);

            sourceNote.LastWateredAt = DateTime.UtcNow;
            targetNote.LastWateredAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new ConnectionResponse
            {
                Id = connection.Id,
                SourceNoteId = connection.SourceNoteId,
                TargetNoteId = connection.TargetNoteId,
                CreatedAt = connection.CreatedAt
            };
        }

        public async Task DeleteConnectionAsync(Guid userId, Guid connectionId)
        {
            var connection = await _db.Connections.FindAsync(connectionId);

            if (connection == null || connection.UserId != userId)
                throw new Exception("Connection not found or access denied");

            _db.Connections.Remove(connection);
            await _db.SaveChangesAsync();
        }

        public async Task<List<ConnectedNoteResponse>> GetConnectedNotesAsync(Guid userId, Guid noteId)
        {
            var note = await _db.Notes.FindAsync(noteId);
            if (note == null || note.UserId != userId)
                throw new Exception("Note not found or access denied");

            var connections = await _db.Connections
                .Where(c => c.SourceNoteId == noteId || c.TargetNoteId == noteId)
                .Include(c => c.SourceNote)
                .Include(c => c.TargetNote)
                .ToListAsync();

            var result = new List<ConnectedNoteResponse>();

            foreach (var connection in connections)
            {
                var connectedNote = connection.SourceNoteId == noteId
                    ? connection.TargetNote
                    : connection.SourceNote;

                var noteResponse = await _noteService.GetNoteByIdAsync(connectedNote.Id, userId);

                if (noteResponse != null)
                {
                    result.Add(new ConnectedNoteResponse
                    {
                        ConnectionId = connection.Id,
                        Note = noteResponse,
                        ConnectedAt = connection.CreatedAt
                    });
                }
            }

            return result.OrderByDescending(c => c.ConnectedAt).ToList();
        }
    }
}