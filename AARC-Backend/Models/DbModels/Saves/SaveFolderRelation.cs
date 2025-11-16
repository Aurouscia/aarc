namespace AARC.Models.DbModels.Saves;

public class SaveFolderRelation:IDbModel, IPrioritizable
{
    public int Id { get; set; }
    public int SaveId { get; set; }
    public int FolderId { get; set; }
    public byte Priority { get; set; }
    public DateTime LastActive { get; set; }
    public bool Deleted { get; set; }
}