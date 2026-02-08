namespace AARC.WebApi.Models.DbModels;

public interface IOwnable
{
    public int OwnerUserId { get; set; }
}