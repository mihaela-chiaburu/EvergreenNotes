using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Entities
{
    public class Connection
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SourceNoteId { get; set; }
        public Guid TargetNoteId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Note SourceNote { get; set; } = null!;
        public Note TargetNote { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}