using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class ConnectedNoteResponse
    {
        public Guid ConnectionId { get; set; }
        public NoteResponse Note { get; set; } = null!;
        public DateTime ConnectedAt { get; set; }
    }
}
