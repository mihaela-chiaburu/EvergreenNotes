using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Entities
{
    public class Tag
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public Guid? ParentTagId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Tag? ParentTag { get; set; }
        public ICollection<Tag> Children { get; set; } = new List<Tag>();
        public ICollection<NoteTag> NoteTags { get; set; } = new List<NoteTag>();
    }
}