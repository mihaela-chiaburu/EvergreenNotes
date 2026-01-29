using EvergreenNotes.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.DTO
{
    public class GetNotesRequest
    {
        public NoteStatus? Status { get; set; }
        public NoteVisibility? Visibility { get; set; }
        public PlantState? PlantState { get; set; }
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
