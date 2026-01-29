using EvergreenNotes.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class UpdateStatusRequest
    {
        public NoteStatus Status { get; set; }
    }
}
