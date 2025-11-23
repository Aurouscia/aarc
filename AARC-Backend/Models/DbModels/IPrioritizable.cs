namespace AARC.Models.DbModels;

public interface IPrioritizable : IDbModel
{
    public byte Priority { get; set; } 
}