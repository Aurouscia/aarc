using System.ComponentModel.DataAnnotations;
using AARC.WebApi.Models.DbModels.Enums;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.DbModels.Saves
{
    [Index(nameof(OwnerUserId))]
    public class Save : IDbModel, IPrioritizable, IOwnable
    {
        public int Id { get; set; }
        [MaxLength(nameMaxLength)]
        public required string Name { get; set; }
        [MaxLength(versionMaxLength)]
        public string? Version { get; set; }
        public int OwnerUserId { get; set; }
        public CcLicense CcLicense { get; set; }
        [MaxLength(introMaxLength)]
        public string? Intro { get; set; }
        [MaxLength(int.MaxValue)]
        public string? Data { get; set; }
        public int StaCount { get; set; }
        public int LineCount { get; set; }
        public byte Priority { get; set; }
        public DateTime HeartbeatAt { get; set; }
        public int HeartbeatUserId { get; set; }
        public DateTime LastActive { get; set; }
        [MaxLength(int.MaxValue)]
        public string? Metadata0 { get; set; }
        [MaxLength(int.MaxValue)]
        public string? Metadata1 { get; set; }
        public bool Deleted { get; set; }

        public const int nameMaxLength = 64;
        public const int versionMaxLength = 32;
        public const int introMaxLength = 256;
    }
}
