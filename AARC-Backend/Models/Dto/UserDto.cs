using AARC.Models.DbModels;

namespace AARC.Models.Dto
{
    public class UserDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Password { get; set; }
        public UserType Type { get; set; }
        public int AvatarFileId { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Intro { get; set; }
        public string? LastActive { get; set; }
    }
}
