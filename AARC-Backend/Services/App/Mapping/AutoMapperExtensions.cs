using AARC.Models.DbModels;
using AutoMapper;

namespace AARC.Services.App.Mapping
{
    public static class AutoMapperExtensions
    {
        public static IMappingExpression<T0, T1> IgnoreLastActive<T0, T1>(
            this IMappingExpression<T0, T1> exp)
        {
            return exp.ForMember(nameof(IDbModel.LastActive), opt =>
            {
                opt.Ignore();
            });
        }
    }
}
