using System.ComponentModel.DataAnnotations;
using AARC.WebApi.Models.DbModels.Enums;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.DbModels.Saves
{
    [Index(nameof(SaveId))]
    [Index(nameof(OwnerUserId))]
    public class SaveComment : IDbModel, IOwnable
    {
        public int Id { get; set; }
        public int SaveId { get; set; }
        public int OwnerUserId { get; set; }
        public DateTime Created { get; set; }
        [MaxLength(contentMaxLength)]
        public required string Content { get; set; }
        public SaveCommentType Type { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }
        public bool Deprecated { get; set; }

        public const int contentMaxLength = 255;
    }
}
