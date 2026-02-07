using Microsoft.EntityFrameworkCore;

namespace AARC.Models.DbModels.Saves;

[Index(nameof(SaveId), nameof(FolderId))]
public class SaveFolderRelation: IPrioritizable
{
    public int Id { get; set; }
    public int SaveId { get; set; }
    public int FolderId { get; set; }
    public byte Priority { get; set; }
}