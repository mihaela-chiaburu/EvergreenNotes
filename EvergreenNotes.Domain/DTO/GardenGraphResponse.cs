namespace EvergreenNotes.Domain.DTO
{
    public class GardenGraphResponse
    {
        public List<string> RootNodeIds { get; set; } = new();
        public List<GardenGraphNodeResponse> Nodes { get; set; } = new();
        public List<GardenGraphEdgeResponse> Edges { get; set; } = new();
    }
}
