using System.Text.Json;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.Diff;
using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Repos;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using LZStringCSharp;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Services.Saves;

public class SaveDiffService(
    AarcContext context,
    IMapper mapper)
{
    private DbSet<SaveDiff> SaveDiffs => context.SaveDiffs;
    private IQueryable Users => context.Users.Existing();
    public void CreateDiff(string oldSave, string newSave, int saveId, int userId, bool saveChanges)
    {
        var options = CreateOptions();
        var diffNode = DiffGenerator.Diff(oldSave, newSave, options);
        var diffJson = diffNode.ToJsonString();
        byte[] bytes = LZString.CompressToUint8Array(diffJson);
        SaveDiff res = new()
        {
            Length = diffJson.Length,
            Data = bytes,
            UserId = userId,
            SaveId = saveId,
            Time = DateTime.Now,
        };
        SaveDiffs.Add(res);
        if (saveChanges)
            context.SaveChanges();
    }

    public List<SaveDiffDto> GetDiffs(int saveId, int userId, int skip, int take)
    {
        if (saveId == 0 && userId == 0)
            throw new RqEx("saveId和UserId不能同时为0");
        take = Math.Clamp(take, 1, 20);
        var q = SaveDiffs.AsQueryable();
        if(saveId > 0)
            q = q.Where(x => x.SaveId == saveId);
        if (userId > 0)
            q = q.Where(x => x.UserId == userId);
        var res = q
            .OrderByDescending(x => x.Id)
            .Skip(skip)
            .Take(take)
            .ProjectTo<SaveDiffDto>(mapper.ConfigurationProvider)
            .ToList();
        
        var userIds = res.Select(x => x.UserId).Distinct().ToList();
        var userNames = context.Users
            .Where(u => userIds.Contains(u.Id))
            .ToDictionary(u => u.Id, u => u.Name);
        foreach (var item in res)
        {
            if (userNames.TryGetValue(item.UserId, out var name))
                item.UserName = name;
        }
        return res;
    }

    /// <summary>
    /// 创建DiffGenerator的选项对象<br/>
    /// 此处与客户端的save.ts绑定，那边如果新增了数组，这边必须同步跟进<br/>
    /// 肯定向后兼容，而只有前端程序可能版本落后，所以不存在版本问题
    /// </summary>
    public static DiffOptions CreateOptions()
    {
        return new DiffOptions
        {
            KeyedArrayConfigs = [
                new KeyedArrayConfig(["points"], false),
                new KeyedArrayConfig(["lines"], true),
                new KeyedArrayConfig(["lineStyles"], true),
                new KeyedArrayConfig(["lineGroups"], true),
                new KeyedArrayConfig(["textTags"], false),
                new KeyedArrayConfig(["textTagIcons"], true)
            ],
            LongArrayConfigs = [
                new LongArrayConfig(["pointLinks"], PtLinkEqMark)
            ]
        };

        static string PtLinkEqMark(JsonElement link)
        {
            if (link.TryGetProperty("pts", out JsonElement pts))
            {
                if (pts.ValueKind != JsonValueKind.Array || pts.GetArrayLength() != 2)
                    throw new InvalidOperationException("pointLink的pts属性异常");
                try
                {
                    var num0 = pts[0].GetDecimal();
                    var num1 = pts[1].GetDecimal();
                    return $"{num0}-{num1}";
                }
                catch
                {
                    throw new InvalidOperationException("pointLink的pts属性非number[]");
                }
            }
            throw new InvalidOperationException("pointLink的pts属性缺失");
        }
    }
}

public class SaveDiffDto
{
    public int Id { get; set; }
    public int SaveId { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? LzJsonDataBase64 { get; set; }
    public int Length { get; set; }
    public int AddedCount { get; set; }
    public int RemovedCount { get; set; }
    public int ModifiedCount { get; set; }
    public string? Time { get; set; }
}

public class SaveDiffDtoProfile : Profile
{
    public SaveDiffDtoProfile()
    {
        CreateMap<SaveDiff, SaveDiffDto>()
            .ForMember(
                destinationMember: x => x.Time,
                memberOptions: mem => mem.MapFrom(x
                    => x.Time.ToString("yyyy-MM-dd HH:mm")))
            .ForMember(
                destinationMember: x => x.LzJsonDataBase64,
                memberOptions: mem => mem.MapFrom(x
                    => Convert.ToBase64String(x.Data)));
    }
}