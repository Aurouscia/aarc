using System.ComponentModel.DataAnnotations;
using AARC.WebApi.Models.DbModels.Enums;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Models.DbModels.Identities
{
    [Index(nameof(Name))]
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
        /// <summary>
        /// 密码重置问题
        /// </summary>
        [MaxLength(passwordResetQuestionMaxLength)]
        public string? PasswordResetQuestion { get; set; }
        /// <summary>
        /// 密码重置问题的答案
        /// </summary>
        [MaxLength(passwordResetAnswerMaxLength)]
        public string? PasswordResetAnswer { get; set; }
        public int SelectedFolderId { get; set; }
        /// <summary>
        /// 外部身份源对该用户的唯一标识（例如 OIDC 的 sub / 主应用用户 GUID）
        /// </summary>
        [MaxLength(externalSubjectIdMaxLength)]
        public string? ExternalSubjectId { get; set; }
        /// <summary>
        /// 外部身份源的 Issuer / 身份提供方标识
        /// </summary>
        [MaxLength(externalIssuerMaxLength)]
        public string? ExternalIssuer { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }

        public bool EmailBinded => Email is not null && Email.Contains('@');

        public const int nameMaxLength = 16;
        public const int emailMaxLength = 64;
        public const int introMaxLength = 128;
        public const int passwordResetQuestionMaxLength = 32;
        public const int passwordResetAnswerMaxLength = 16;
        public const int externalSubjectIdMaxLength = 256;
        public const int externalIssuerMaxLength = 128;
    }
}
