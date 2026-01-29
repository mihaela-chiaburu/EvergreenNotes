using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Entities
{
    public class NoteTag
    {
        public Guid NoteId { get; set; }
        public Guid TagId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Note Note { get; set; } = null!;
        public Tag Tag { get; set; } = null!;
    }
}