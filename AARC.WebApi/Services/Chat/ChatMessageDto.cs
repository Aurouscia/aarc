namespace AARC.WebApi.Services.Chat
{
    public class ChatMessageDto
    {
        public string MessageId { get; set; } = Guid.NewGuid().ToString();
        public string RoomName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsSystem { get; set; }
    }
}
