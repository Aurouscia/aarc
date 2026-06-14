using AARC.WebApi.Models.Db.Context;
using AARC.WebApi.Models.DbModels.Enums;
using AARC.WebApi.Models.DbModels.Saves;
using AARC.WebApi.Services.App.HttpAuthInfo;
using AARC.WebApi.Services.App.Mapping;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AARC.WebApi.Repos.Saves
{
    public class SaveCommentRepo(
        AarcContext context,
        HttpUserIdProvider httpUserIdProvider,
        IMapper mapper
        ) : Repo<SaveComment>(context)
    {
        public IQueryable<SaveComment> ExistingAndValid => Existing.Where(x => !x.Deprecated);

        public SaveComment Add(int saveId, string content, SaveCommentType type)
        {
            CheckModel(content);
            var uid = httpUserIdProvider.RequireUserId();
            if (type == SaveCommentType.Rule)
            {
                var oldRules = Existing.Where(x => x.SaveId == saveId && x.Type == SaveCommentType.Rule && !x.Deprecated).ToList();
                foreach (var old in oldRules)
                {
                    old.Deprecated = true;
                    old.LastActive = DateTime.Now;
                    context.Update(old);
                }
                if (oldRules.Count > 0)
                    context.SaveChanges();
            }
            var model = new SaveComment
            {
                SaveId = saveId,
                OwnerUserId = uid,
                Created = DateTime.Now,
                Content = content,
                Type = type
            };
            Add(model);
            return model;
        }

        public void Edit(int id, string content)
        {
            CheckModel(content);
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid) throw new RqEx("无权操作");
            model.Content = content;
            base.Update(model, true);
        }

        public void Delete(int id)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid) throw new RqEx("无权操作");
            base.FakeRemove(model);
        }

        public void SetDeprecated(int id)
        {
            var uid = httpUserIdProvider.RequireUserId();
            var model = base.Get(id) ?? throw new RqEx("找不到指定数据");
            if (model.OwnerUserId != uid) throw new RqEx("无权操作");
            model.Deprecated = true;
            base.Update(model, true);
        }

        public List<SaveCommentDto> GetBySaveId(int saveId, int skip, int take)
        {
            var q = Existing.Where(x => x.SaveId == saveId);
            q = q.OrderByDescending(x => x.Created);
            if (skip > 0)
                q = q.Skip(skip);
            take = Math.Clamp(take, 1, 50);
            q = q.Take(take);
            var temp = (
                from c in q
                join u in Context.Users
                on c.OwnerUserId equals u.Id
                select new
                {
                    Comment = c,
                    AuthorName = u.Name
                }).ToList();
            List<SaveCommentDto> res = [];
            foreach (var t in temp)
            {
                var dto = mapper.Map<SaveComment, SaveCommentDto>(t.Comment);
                dto.AuthorUserName = t.AuthorName;
                res.Add(dto);
            }
            return res;
        }

        private static void CheckModel(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new RqEx("内容不能为空");
            if (content.Length > SaveComment.contentMaxLength)
                throw new RqEx("内容过长");
        }
    }

    public class SaveCommentDto
    {
        public int Id { get; set; }
        public int SaveId { get; set; }
        public int OwnerUserId { get; set; }
        public string? AuthorUserName { get; set; }
        public string? Content { get; set; }
        public SaveCommentType Type { get; set; }
        public string? Created { get; set; }
        public bool Deprecated { get; set; }
    }

    public class SaveCommentProfile : Profile
    {
        public SaveCommentProfile()
        {
            CreateMap<SaveCommentDto, SaveComment>()
                .IgnoreLastActive();
            CreateMap<SaveComment, SaveCommentDto>()
                .ForMember(
                    destinationMember: x => x.Created,
                    memberOptions: mem => mem.MapFrom(source => source.Created.ToString("yyyy-MM-dd HH:mm")));
        }
    }
}
