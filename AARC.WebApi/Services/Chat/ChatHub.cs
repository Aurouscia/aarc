using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Identities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AARC.WebApi.Services.Chat
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly AarcContext _db;
        private readonly ILogger<ChatHub> _logger;
        // 内存中每个房间最近的 50 条消息
        private static readonly ConcurrentDictionary<string, ConcurrentQueue<ChatMessageDto>> _roomMessages = new();
        // 每个连接加入了哪些房间，用于断开时自动补发离开消息
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _connectionRooms = new();
        private const int MaxHistoryPerRoom = 50;

        public ChatHub(AarcContext db, ILogger<ChatHub> logger)
        {
            _db = db;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("[ChatHub] 连接建立 connectionId={ConnectionId}, user={UserName}", Context.ConnectionId, Context.User?.Identity?.Name ?? "?");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("[ChatHub] 连接断开 connectionId={ConnectionId}, reason={Reason}", Context.ConnectionId, exception?.Message ?? "无");
            if (_connectionRooms.TryRemove(Context.ConnectionId, out var rooms))
            {
                var userInfo = TryGetCurrentUserInfo();
                foreach (var roomName in rooms.Keys)
                {
                    var leaveMsg = new ChatMessageDto
                    {
                        RoomName = roomName,
                        UserId = userInfo?.Id ?? 0,
                        UserName = userInfo?.Name ?? "?",
                        Content = $"{userInfo?.Name ?? "?"} 离开了房间",
                        SentAt = DateTime.Now,
                        IsSystem = true
                    };
                    AddMessageToHistory(roomName, leaveMsg);
                    await Clients.Group(roomName).SendAsync("UserLeft", leaveMsg);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRoom(string roomName)
        {
            if (string.IsNullOrWhiteSpace(roomName))
                throw new RqEx("房间名不能为空");

            var user = GetCurrentUser();
            await Groups.AddToGroupAsync(Context.ConnectionId, roomName);
            _connectionRooms.GetOrAdd(Context.ConnectionId, _ => new ConcurrentDictionary<string, byte>())[roomName] = 1;

            var joinMsg = new ChatMessageDto
            {
                RoomName = roomName,
                UserId = user.Id,
                UserName = user.Name,
                Content = $"{user.Name} 加入了房间",
                SentAt = DateTime.Now,
                IsSystem = true
            };
            AddMessageToHistory(roomName, joinMsg);
            await Clients.Group(roomName).SendAsync("UserJoined", joinMsg);
        }

        public async Task LeaveRoom(string roomName)
        {
            if (string.IsNullOrWhiteSpace(roomName))
                throw new RqEx("房间名不能为空");

            var user = GetCurrentUser();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);
            if (_connectionRooms.TryGetValue(Context.ConnectionId, out var rooms))
            {
                rooms.TryRemove(roomName, out _);
            }

            var leaveMsg = new ChatMessageDto
            {
                RoomName = roomName,
                UserId = user.Id,
                UserName = user.Name,
                Content = $"{user.Name} 离开了房间",
                SentAt = DateTime.Now,
                IsSystem = true
            };
            AddMessageToHistory(roomName, leaveMsg);
            await Clients.Group(roomName).SendAsync("UserLeft", leaveMsg);
        }

        public async Task SendMessage(string roomName, string message)
        {
            if (string.IsNullOrWhiteSpace(roomName))
                throw new RqEx("房间名不能为空");
            if (string.IsNullOrWhiteSpace(message))
                throw new RqEx("消息内容不能为空");
            if (message.Length > 1000)
                throw new RqEx("消息内容过长");

            var user = GetCurrentUser();
            var msgDto = new ChatMessageDto
            {
                RoomName = roomName,
                UserId = user.Id,
                UserName = user.Name,
                Content = message,
                SentAt = DateTime.Now,
                IsSystem = false
            };
            AddMessageToHistory(roomName, msgDto);
            _logger.LogInformation("[ChatHub] 发送消息 room={RoomName}, msgId={MessageId}, sentAt={SentAt:O}", roomName, msgDto.MessageId, msgDto.SentAt);
            await Clients.Group(roomName).SendAsync("ReceiveMessage", msgDto);
        }

        /// <summary>
        /// 同步某房间最近的全部历史消息（最近 50 条）
        /// </summary>
        public async Task SyncHistory(string roomName)
        {
            if (string.IsNullOrWhiteSpace(roomName))
                throw new RqEx("房间名不能为空");

            _logger.LogInformation("[ChatHub] SyncHistory room={RoomName}, caller={ConnectionId}", roomName, Context.ConnectionId);
            if (!_roomMessages.TryGetValue(roomName, out var queue) || queue.IsEmpty)
            {
                _logger.LogInformation("[ChatHub] SyncHistory room={RoomName} 无历史记录", roomName);
                return;
            }

            var messages = queue.ToList();
            _logger.LogInformation("[ChatHub] SyncHistory room={RoomName} 共 {Count} 条, 返回全部历史", roomName, messages.Count);
            await Clients.Caller.SendAsync("LoadHistory", messages.ToArray());
        }

        private void AddMessageToHistory(string roomName, ChatMessageDto message)
        {
            var queue = _roomMessages.GetOrAdd(roomName, _ => new ConcurrentQueue<ChatMessageDto>());
            queue.Enqueue(message);
            // 保持最多 50 条
            while (queue.Count > MaxHistoryPerRoom && queue.TryDequeue(out _)) { }
            _logger.LogInformation("[ChatHub] 消息入队 room={RoomName}, queueSize={QueueSize}, msgId={MessageId}", roomName, queue.Count, message.MessageId);
        }

        private User GetCurrentUser()
        {
            var user = TryGetCurrentUserInfo();
            if (user is null)
                throw new RqEx("请登录后重试");
            return user;
        }

        private User? TryGetCurrentUserInfo()
        {
            var userIdClaim = Context.User?.Claims
                .FirstOrDefault(x => x.Type.Contains(JwtRegisteredClaimNames.NameId));
            if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out int userId))
                return null;

            return _db.Users.FirstOrDefault(x => x.Id == userId && !x.Deleted);
        }
    }
}
