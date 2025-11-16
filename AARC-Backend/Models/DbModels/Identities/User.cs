using System.ComponentModel.DataAnnotations;
using AARC.Models.DbModels.Enums;

namespace AARC.Models.DbModels.Identities
{
    public class User : IDbModel
    {
        public int Id { get; set; }
        [MaxLength(nameMaxLength)]
        public required string Name { get; set; }
        [MaxLength(32)]
        public required string Password { get; set; }
        [MaxLength(emailMaxLength)]
        public string? Email { get; set; }
        public UserType Type { get; set; }
        public int AvatarUserFileId { get; set; }
        [MaxLength(introMaxLength)]
        public string? Intro { get; set; }
        public CcLicense CcLicense { get; set; }
        [MaxLength(passwordResetQuestionMaxLength)]
        public string? PasswordResetQuestion { get; set; }
        [MaxLength(passwordResetAnswerMaxLength)]
        public string? PasswordResetAnswer { get; set; }
        public int SelectedFolderId { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }

        public const int nameMaxLength = 16;
        public const int emailMaxLength = 64;
        public const int introMaxLength = 128;
        public const int passwordResetQuestionMaxLength = 16;
        public const int passwordResetAnswerMaxLength = 16;
    }
}
