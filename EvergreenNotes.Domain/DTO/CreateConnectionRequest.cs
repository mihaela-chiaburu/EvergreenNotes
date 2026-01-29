using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class CreateConnectionRequest
    {
        public Guid TargetNoteId { get; set; }
    }
}
