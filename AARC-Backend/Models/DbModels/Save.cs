using System.ComponentModel.DataAnnotations;

namespace AARC.Models.DbModels
{
    public class Save
    {
        public int Id { get; set; }
        [MaxLength(64)]
        public required string Name { get; set; }
        [MaxLength(32)]
        public string? Version { get; set; }
        public int OwnerUserId { get; set; }
        [MaxLength(256)]
        public string? Intro { get; set; }
        public string? Data { get; set; }
        public int StaCount { get; set; }
        public int LineCount { get; set; }
        public byte Priority { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }
    }
}
