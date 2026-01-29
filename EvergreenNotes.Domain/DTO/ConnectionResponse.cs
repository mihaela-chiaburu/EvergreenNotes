using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class ConnectionResponse
    {
        public Guid Id { get; set; }
        public Guid SourceNoteId { get; set; }
        public Guid TargetNoteId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
