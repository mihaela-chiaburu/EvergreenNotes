using EvergreenNotes.Domain.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Interfaces
{
    public interface IConnectionService
    {
        Task<ConnectionResponse> CreateConnectionAsync(Guid userId, Guid sourceNoteId, Guid targetNoteId);
        Task DeleteConnectionAsync(Guid userId, Guid connectionId);
        Task<List<ConnectedNoteResponse>> GetConnectedNotesAsync(Guid userId, Guid noteId);
    }
}
