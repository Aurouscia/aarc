namespace AARC.Models.DbModels;

public interface IOwnable
{
    public int OwnerUserId { get; set; }
}