using System.ComponentModel.DataAnnotations;

namespace AARC.Models.DbModels.Saves;

public class SaveFolder:IDbModel, IPrioritizable, IOwnable
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }
    public int ParentFolderId { get; set; }
    [MaxLength(nameMaxLength)]
    public required string Name { get; set; }
    [MaxLength(introMaxLength)]
    public string? Intro { get; set; }
    public byte Priority { get; set; }
    public DateTime LastActive { get; set; }
    public bool Deleted { get; set; }
    
    public const int nameMaxLength = 64;
    public const int introMaxLength = 128;
}