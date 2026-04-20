namespace EvergreenNotes.Domain.Interfaces
{
    public interface IReviewQuestionGenerator
    {
        Task<string> GenerateQuestionAsync(string title, string content, CancellationToken cancellationToken = default);
    }
}
