namespace AARC.WebApi.Models.DbModels
{
    public interface IDbModel
    {
        public int Id { get; set; }
        public DateTime LastActive { get; set; }
        public bool Deleted { get; set; }
    }
}
