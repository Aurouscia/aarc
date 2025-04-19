using System.ComponentModel.DataAnnotations;

namespace AARC.Models.DbModels
{
    public class User : IDbModel
    {
        public int Id { get; set; }
        [MaxLength(nameMaxLength)]
        public required string Name { get; set; }
        [MaxLength(32)]
        public required string Password { get; set; }
        public UserType Type { get; set; }
        public int AvatarFileId { get; set; }
        [MaxLength(introMaxLength)]
        public string? Intro { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }

        public const int nameMaxLength = 16;
        public const int introMaxLength = 128;
    }
    public enum UserType: byte
    {
        Tourist = 0,
        Member = 1,
        Admin = 8
    }
}
