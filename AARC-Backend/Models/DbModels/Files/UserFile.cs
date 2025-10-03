using System.ComponentModel.DataAnnotations;

namespace AARC.Models.DbModels.Files
{
    public class UserFile : IDbModel
    {
        public int Id { get; set; }
        [MaxLength(64)]
        public required string DisplayName { get; set; }
        [MaxLength(64)]
        public required string StoreName { get; set; }
        public int OwnerUserId { get; set; }
        [MaxLength(128)]
        public string? Intro { get; set; }
        public int Size { get; set; }
        public UserFileScope Scope { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }
    }
    public enum UserFileScope: byte
    {
        Private = 0,
        Friends = 1,
        Public = 255
    }
}
