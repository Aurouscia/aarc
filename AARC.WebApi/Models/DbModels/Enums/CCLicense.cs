namespace AARC.WebApi.Models.DbModels.Enums;

/// <summary>
/// 作品的CreativeCommons许可证
/// </summary>
public enum CcLicense:byte
{
    /// <summary>
    /// 默认（默认为NoRepost，可以覆盖）
    /// </summary>
    Default = 0, 
    
    /// <summary>
    /// 禁止转载和改编
    /// </summary>
    NoRepost = 1,
    
    /// <summary>
    /// 转载必须带上作者名
    /// </summary>
    By = 2,
    
    /// <summary>
    /// 转载必须带上作者名；若对作品进行改编，新作品必须使用与本作品完全相同的CC许可证发布
    /// </summary>
    BySa = 3,
    
    /// <summary>
    /// 转载必须带上作者名；禁止用于商业用途
    /// </summary>
    ByNc = 4,
    
    /// <summary>
    /// 转载必须带上作者名；禁止修改或创建衍生作品
    /// </summary>
    ByNd = 5,
    
    /// <summary>
    /// 转载必须带上作者名；禁止用于商业用途；若对作品进行改编，新作品必须使用与本作品完全相同的CC许可证发布
    /// </summary>
    ByNcSa = 6,
    
    /// <summary>
    /// 转载必须带上作者名；禁止用于商业用途；禁止修改或创建衍生作品
    /// </summary>
    ByNcNd = 7,
    
    /// <summary>
    /// 作者放弃一切权利，将作品完全奉献给公有领域，使用者无需署名，可自由使用于任何目的
    /// </summary>
    Cc0 = 8
}