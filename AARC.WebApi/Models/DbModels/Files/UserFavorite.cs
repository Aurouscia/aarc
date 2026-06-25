using AARC.WebApi.Models.DbModels.Enums;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace AARC.WebApi.Models.DbModels.Files
{
    [Index(nameof(OwnerUserId), nameof(Type), nameof(Group))]
    public class UserFavorite : IDbModel, IOwnable
    {
        public int Id { get; set; }
        [MaxLength(16)]
        public string? Group { get; set; }
        public UserFavoriteType Type { get; set; }
        public int ObjectId { get; set; }
        public int OwnerUserId { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }
    }
}
