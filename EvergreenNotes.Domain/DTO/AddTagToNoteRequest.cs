using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class AddTagToNoteRequest
    {
        public Guid TagId { get; set; }
    }
}
