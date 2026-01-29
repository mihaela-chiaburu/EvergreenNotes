using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EvergreenNotes.Domain.Entities
{
    public class Garden
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }

        // Garden settings
        public GardenVisibility Visibility { get; set; } = GardenVisibility.Private;
        public GardenViewType DefaultViewType { get; set; } = GardenViewType.Garden;
        public string? GardenTheme { get; set; } // e.g., "forest", "desert", "zen"
        public string? Bio { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }

    public enum GardenVisibility
    {
        Private = 0,
        SemiPublic = 1, // Only followed users can see
        Public = 2
    }

    public enum GardenViewType
    {
        Garden = 0,  // 🌱 Visual garden view
        Graph = 1,   // 🕸 Graph/network view
        List = 2     // 🗂 List view
    }
}