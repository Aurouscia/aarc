using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace AARC.Models.DbModels.Saves;

[Index(nameof(SaveId), nameof(UserId))]
public class SaveDiff
{
    public int Id { get; set; }
    public int SaveId { get; set; }
    public int UserId { get; set; }
    public required byte[] Data { get; set; }
    public int Length { get; set; }
    public int AddedCount { get; set; }
    public int RemovedCount { get; set; }
    public int ModifiedCount { get; set; }
    public DateTime Time { get; set; }
}