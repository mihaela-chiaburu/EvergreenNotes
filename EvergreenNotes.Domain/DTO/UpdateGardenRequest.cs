using EvergreenNotes.Domain.Entities;

namespace EvergreenNotes.Domain.DTO
{
    public class UpdateGardenRequest
    {
        public GardenVisibility? Visibility { get; set; }
        public GardenViewType? DefaultViewType { get; set; }
        public string? GardenTheme { get; set; }
        public string? Bio { get; set; }
    }
}