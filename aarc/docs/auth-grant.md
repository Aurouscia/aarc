# AuthGrant 模型分析

## 1. 作用与定位

`AuthGrant` 是一个**授权访问控制列表（ACL）**模型，用于描述“谁（To）可以对什么资源（On）执行哪种操作（Type），并允许或拒绝（Flag）”。它支持：

- **资源级授权**：针对单个资源（如某一张 Save/存档）设置权限。
- **用户级全局授权**：针对某个用户设置全局默认权限（`OnId = 0`，`UserId` 有值），对该用户拥有的所有同类资源生效。
- **级联覆盖**：全局设置优先于实体设置之前被评估，但最终以优先级最高且匹配的规则为准。

目前实际主要用于 **`Save`（存档）** 的查看、编辑、另存等权限控制；模型层面已预留对 `SaveFolder`、`UserFile` 的支持，但当前业务代码中尚未启用这两者的授权检查。

---

## 2. 存储方式

### 2.1 数据库上下文

`AuthGrant` 通过 EF Core 持久化到数据库：

```csharp
// AARC.WebApi/Models/Db/Context/AarcContext.cs
public abstract class AarcContext: DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserHistory> UserHistories { get; set; }
    public DbSet<AuthGrant> AuthGrants { get; set; }
    public DbSet<UserFile> UserFiles { get; set; }
    // ...
}
```

### 2.2 表结构

SQLite 迁移文件：`AARC.WebApi/Models/Db/Migrations/Sqlite/20251116145418_CreateTableAuthGrants.cs`

```csharp
migrationBuilder.CreateTable(
    name: "AuthGrants",
    columns: table => new
    {
        Id = table.Column<int>(type: "INTEGER", nullable: false)
            .Annotation("Sqlite:Autoincrement", true),
        On = table.Column<byte>(type: "INTEGER", nullable: false),
        OnId = table.Column<int>(type: "INTEGER", nullable: false),
        To = table.Column<byte>(type: "INTEGER", nullable: false),
        ToId = table.Column<int>(type: "INTEGER", nullable: false),
        Type = table.Column<byte>(type: "INTEGER", nullable: false),
        Flag = table.Column<bool>(type: "INTEGER", nullable: false),
        UserId = table.Column<int>(type: "INTEGER", nullable: false),
        Priority = table.Column<byte>(type: "INTEGER", nullable: false),
        LastActive = table.Column<DateTime>(type: "TEXT", nullable: false),
        Deleted = table.Column<bool>(type: "INTEGER", nullable: false)
    },
    constraints: table =>
    {
        table.PrimaryKey("PK_AuthGrants", x => x.Id);
    });
```

另有 `IX_AuthGrants_OnId` 索引。项目同时存在 SQL Server 迁移版本。

---

## 3. 核心模型定义

### 3.1 `AuthGrant` 实体

文件：`AARC.WebApi/Models/DbModels/Identities/AuthGrant.cs`

```csharp
/// <summary>
/// 授权
/// </summary>
[Index(nameof(OnId))]
public class AuthGrant : IDbModel, IPrioritizable
{
    public int Id { get; set; }
    /// <summary>授权客体类型</summary>
    public AuthGrantOn On { get; set; }
    /// <summary>授权客体Id（当表示“创建者的全局设置”时为0）</summary>
    public int OnId { get; set; }
    /// <summary>授权主体类型</summary>
    public AuthGrantTo To { get; set; }
    /// <summary>授权主体Id（当授权主体是泛指时为0）</summary>
    public int ToId { get; set; }
    /// <summary>授权客体操作类型</summary>
    public byte Type { get; set; }
    /// <summary>允许/拒绝</summary>
    public bool Flag { get; set; }
    /// <summary>用户id（仅在表示“创建者的全局设置”时有值，与OnId必须有且仅有一个有值）</summary>
    public int UserId { get; set; }
    public byte Priority { get; set; }
    public DateTime LastActive { get; set; }
    public bool Deleted { get; set; }
}
```

### 3.2 枚举

**AuthGrantOn**（授权对象类型）：

```csharp
public enum AuthGrantOn : byte
{
    Unknown = 0,
    Save = 1,
    SaveFolder = 2,
    UserFile = 3
}
```

**AuthGrantTo**（授权主体类型）：

```csharp
public enum AuthGrantTo : byte
{
    Unknown = 0,
    User = 1,                // 某个用户
    UserGroup = 2,           // 某个用户组（当前未使用）
    All = 10,                // 所有人（包括未登录）
    AllMembers = 11,         // 所有正式用户
    AllOwnerFollowing = 12,  // 所有我关注的（有该设置时，不允许转让客体）
    AllOwnerFollowers = 13,  // 所有关注我的（有该设置时，不允许转让客体）
    Gallery = 20             // 画廊
}
```

**AuthGrantTypeOfSave**（Save 上的操作类型）：

```csharp
public enum AuthGrantTypeOfSave : byte
{
    Unknown = 0,
    View = 1,
    ExportImage = 2,
    ExportJson = 3,
    Edit = 4,
    Comment = 5,
    Fork = 6
}
```

---

## 4. 认证/授权流程

### 4.1 检查入口：`AuthGrantCheckService`

文件：`AARC.WebApi/Services/Identities/AuthGrants/AuthGrantCheckService.cs`

核心方法：

```csharp
public void CheckFor(AuthGrantOn on, int onId, byte type, bool defaultAllow)
{
    var res = CalculateFor(on, [onId], type).FirstOrDefault();
    if (res == AuthGrantCheckResult.Reject
        || (!defaultAllow && res == AuthGrantCheckResult.Default))
        throw new RqEx("拒绝访问");
}
```

批量计算方法 `CalculateFor`：

```csharp
public List<AuthGrantCheckResult> CalculateFor(AuthGrantOn on, List<int> onIds, byte type)
{
    var isSaveEditing = on == AuthGrantOn.Save && type == (byte)AuthGrantTypeOfSave.Edit;
    bool isAdmin = userInfoService.IsAdmin;
    if (isAdmin && !isSaveEditing)
        return Enumerable.Repeat(AuthGrantCheckResult.Allow, onIds.Count).ToList();

    var owners = authGrantOwnerService.GetOwnerOf(on, onIds);
    var allGrants = Existing
        .Where(x => x.On == on && x.Type == type)
        .Where(x => owners.Contains(x.UserId) || onIds.Contains(x.OnId))
        .ToList();

    var res = new List<AuthGrantCheckResult>(onIds.Count);
    bool isMember = userInfoService.IsMember;
    int uid = userInfoService.UserInfo.Value.Id;
    for (int i = 0; i < onIds.Count; i++)
    {
        AuthGrantCheckResult result = AuthGrantCheckResult.Default;
        var owner = owners[i];
        var onId = onIds[i];
        if (owner == uid)
            result = AuthGrantCheckResult.Allow;
        else
        {
            var grants = allGrants.FindAll(x => x.UserId == owner || x.OnId == onId);
            grants = OrderByCascadingRule(grants);
            foreach (var ag in grants)
            {
                bool match =
                    ag.To == AuthGrantTo.All
                    || ag.To == AuthGrantTo.AllMembers && isMember
                    || ag.To == AuthGrantTo.User && uid == ag.ToId;
                if (match)
                    result = ag.Flag ? AuthGrantCheckResult.Allow : AuthGrantCheckResult.Reject;
            }
        }
        res.Add(result);
    }
    return res;
}
```

**级联排序规则**：

```csharp
private static List<AuthGrant> OrderByCascadingRule(List<AuthGrant> authGrants)
{
    List<AuthGrant> onUser = [];
    List<AuthGrant> onEntity = [];
    foreach (var ag in authGrants)
    {
        if (ag.UserId > 0) onUser.Add(ag);
        else onEntity.Add(ag);
    }
    onUser.Sort((x, y) => x.Priority - y.Priority);
    onEntity.Sort((x, y) => x.Priority - y.Priority);
    return [..onUser, ..onEntity]; // 用户默认的排前面，本体的排后面
}
```

### 4.2 结果枚举

```csharp
public enum AuthGrantCheckResult
{
    Default = 0,
    Reject = 1,
    Allow = 2
}
```

- `Default`：没有命中任何规则，使用调用方传入的 `defaultAllow`。
- `Reject`：明确拒绝。
- `Allow`：明确允许。

### 4.3 资源所有者服务：`AuthGrantOwnerService`

文件：`AARC.WebApi/Services/Identities/AuthGrants/AuthGrantOwnerService.cs`

用于验证当前用户是否为资源所有者，以及查询资源 owner：

```csharp
public List<int> GetOwnerOf(AuthGrantOn on, List<int> onIds)
{
    switch (on)
    {
        case AuthGrantOn.Save:       return GetOwnersOf<Save>(onIds);
        case AuthGrantOn.SaveFolder: return GetOwnersOf<SaveFolder>(onIds);
        case AuthGrantOn.UserFile:   return GetOwnersOf<UserFile>(onIds);
        case AuthGrantOn.Unknown:
        default: throw new InvalidOperationException("未知的AuthGrantOn类型");
    }
}
```

---

## 5. 仓库层：`AuthGrantRepo`

文件：`AARC.WebApi/Repos/Identities/AuthGrantRepo.cs`

```csharp
public class AuthGrantRepo(
    AarcContext context,
    HttpUserIdProvider httpUserIdProvider,
    AuthGrantOwnerService authGrantOwnerService
) : Repo<AuthGrant>(context)
{
    public override bool AllowUpdate => false;      // 不允许 Update，只允许增删
    public override bool AllowRealRemove => true;   // 允许物理删除

    public List<AuthGrant> LoadAuthGrants(AuthGrantOn on, int onId, byte type)
    {
        authGrantOwnerService.EnsureIsOwnerOf(on, onId);
        return ExistingFiltered(on, onId, type).ToList();
    }

    public void CreateAuthGrant(AuthGrant item)
    {
        AccessCheck(item);
        Add(item);
        var list = ExistingFiltered(item.On, item.OnId, item.Type).ToList();
        list.Add(item);
        list.RearrangePriority();
        Context.SaveChanges();
    }

    public void SetAuthGrantPriorities(AuthGrantOn on, int onId, byte type, List<int> ids)
    {
        var list = ExistingFiltered(on, onId, type).ToList();
        list.RearrangePriority(ids);
        Context.SaveChanges();
    }

    public void RemoveAuthGrant(AuthGrant item)
    {
        AccessCheck(item);
        RealRemove(item);
    }
}
```

**权限校验 `AccessCheck`**：确保 `UserId` 与 `OnId` 有且仅有一个有值，且当前用户是资源所有者。

---

## 6. API 控制器：`AuthGrantController`

文件：`AARC.WebApi/Controllers/Identities/AuthGrantController.cs`

```csharp
[Authorize]
[ApiController]
[Route(ApiConsts.routePattern)]
public class AuthGrantController(AuthGrantRepo authGrantRepo) : Controller
{
    [HttpGet]
    public List<AuthGrant> Load(AuthGrantOn on, int onId, byte type)
        => authGrantRepo.LoadAuthGrants(on, onId, type);

    [HttpPost]
    public bool Create([FromBody] AuthGrant item)
    {
        authGrantRepo.CreateAuthGrant(item);
        return true;
    }

    [HttpPost]
    public bool SetPriorities(AuthGrantOn on, int onId, byte type, [FromBody] List<int> ids)
    {
        authGrantRepo.SetAuthGrantPriorities(on, onId, type, ids);
        return true;
    }

    [HttpDelete]
    public bool Remove(AuthGrant item)
    {
        authGrantRepo.RemoveAuthGrant(item);
        return true;
    }

    /// <summary>为了确保前端生成 AuthGrantType 有关 enum 类型</summary>
    [HttpGet]
    public bool Types(AuthGrantTypeOfSave t0) => true;
}
```

---

## 7. 业务使用场景

### 7.1 `SaveController` 中的权限检查

文件：`AARC.WebApi/Controllers/Saves/SaveController.cs`

- `Fork`：`CheckFor(AuthGrantOn.Save, id, Fork, false)`
- `LoadInfo`：`CheckFor(..., View, true)`（默认允许，用于公开查看）
- `LoadData(forEdit=true)`：先 `View(true)`，再 `Edit(false)`
- `GetBackupList` / `DownloadBackup`：`View(true)`
- `Preflight`：用 `CalculateFor` 计算 `View` 和 `Edit` 返回状态
- `SaveDataToDbAndBackup`：非所有者更新时检查 `Edit(false)`，并记录 diff

### 7.2 `SaveSvgController`

文件：`AARC.WebApi/Controllers/Saves/SaveSvgController.cs`

非所有者上传 SVG 时检查 `Edit` 权限。

### 7.3 `SaveRecommendController`

文件：`AARC.WebApi/Controllers/Saves/SaveRecommendController.cs`

随机推荐“允许所有人编辑”的公开存档。直接查询 `AuthGrants`：

```csharp
var allEditGrants = context.AuthGrants.AsNoTracking().Existing()
    .Where(x => x.On == AuthGrantOn.Save
                && x.Type == (byte)AuthGrantTypeOfSave.Edit
                && x.To == AuthGrantTo.All
                && ((x.OnId > 0 && latestIds.Contains(x.OnId))
                    || (x.OnId == 0 && latestOwnerIds.Contains(x.UserId))))
    .Select(x => new { x.OnId, x.UserId, x.Flag, x.Priority })
    .ToList();
```

### 7.4 `SaveDtoEnrichService`

文件：`AARC.WebApi/Services/Saves/SaveDtoEnrichService.cs`

为返回的 `SaveDto` 附加当前请求者对每个存档的 `View/Edit/Fork` 权限：

```csharp
public void EnrichPrivilege(List<SaveDto> saves, bool needFork = false)
{
    var ids = saves.ConvertAll(x => x.Id);
    var allowEdit = authGrantCheckService.CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.Edit, false);
    var allowView = authGrantCheckService.CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.View, true);
    var allowFork = needFork ? authGrantCheckService.CalculateFor(AuthGrantOn.Save, ids, (byte)AuthGrantTypeOfSave.Fork, false) : [];
    for (int i = 0; i < saves.Count; i++)
    {
        saves[i].AllowRequesterEdit = allowEdit.ElementAtOrDefault(i);
        saves[i].AllowRequesterView = allowView.ElementAtOrDefault(i);
        saves[i].AllowRequesterFork = allowFork.ElementAtOrDefault(i);
    }
}
```

### 7.5 `SudoController` 中的管理操作

文件：`AARC.WebApi/Controllers/System/SudoController.cs`

管理员可一键删除所有“允许所有人编辑”的授权：

```csharp
[HttpPost]
public string RemoveAllPublicSaveEditAuthGrants([FromForm] string masterKey)
{
    masterKeyChecker.Check(masterKey);
    var deleted = context.AuthGrants
        .Where(x => x.On == AuthGrantOn.Save)
        .Where(x => x.Type == (byte)AuthGrantTypeOfSave.Edit)
        .Where(x => x.Flag == true)
        .Where(x => x.To == AuthGrantTo.All)
        .ExecuteDelete();
    return $"已删除 {deleted} 条“允许所有人编辑”授权";
}
```

---

## 8. 前端相关

### 8.1 生成的 API 客户端

文件：`aarc/src/app/com/apiGenerated.ts`

```typescript
export interface AuthGrant {
    id?: number;
    on?: AuthGrantOn;
    onId?: number;
    to?: AuthGrantTo;
    toId?: number;
    type?: number;
    flag?: boolean;
    userId?: number;
    priority?: number;
    lastActive?: Date;
    deleted?: boolean;
}

export enum AuthGrantOn { Unknown = 0, Save = 1, SaveFolder = 2, UserFile = 3 }
export enum AuthGrantTo { Unknown = 0, User = 1, UserGroup = 2, All = 10, AllMembers = 11, AllOwnerFollowing = 12, AllOwnerFollowers = 13, Gallery = 20 }
export enum AuthGrantTypeOfSave { Unknown = 0, View = 1, ExportImage = 2, ExportJson = 3, Edit = 4, Comment = 5, Fork = 6 }

export class AuthGrantClient {
    load(on, onId, type): Promise<AuthGrant[]>;
    create(item): Promise<boolean>;
    setPriorities(on, onId, type, ids): Promise<boolean>;
    remove(item): Promise<boolean>;
    types(t0): Promise<boolean>;
}
```

在 `apiStore.ts` 中注册：

```typescript
const authGrant = w(new api.AuthGrantClient(baseUrl, instance))
```

### 8.2 权限编辑组件：`AuthGrantEdit.vue`

文件：`aarc/src/pages/components/AuthGrantEdit.vue`

- 支持新增/删除/上移授权规则。
- 可设置 `Flag`（允许/拒绝）、`To`（All / AllMembers / User）、`ToId`（用户 ID）。
- 对 `Save.Edit` 做了特殊限制：
  - 不允许“允许所有人编辑”。
  - “允许正式会员编辑”会弹出警告确认。
- 对全局设置（`onId == 0`）自动填充当前 `userId`。

### 8.3 使用位置

**全局个人授权管理**：

文件：`aarc/src/pages/identities/UserList.vue`

```vue
<SideBar ref="authGrantSidebar">
    <h1>授权管理</h1>
    <SwitchingTabs :texts="['作品查看', '作品编辑', '作品另存']">
        <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="0" :type="AuthGrantTypeOfSave.View"/>
        <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="0" :type="AuthGrantTypeOfSave.Edit"/>
        <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="0" :type="AuthGrantTypeOfSave.Fork"/>
    </SwitchingTabs>
    <div class="smallNote">
        注：这里是全局设置，对所有存档有效...
    </div>
</SideBar>
```

顶部栏入口：`aarc/src/app/topbar/topbarData.ts`

```typescript
{
    title: "个人授权管理",
    link: { name: userListName },
    beforeJump: () => { userList.openingSelfEdit = 'authGrant' }
}
```

**单个存档授权管理**：

文件：`aarc/src/pages/saves/components/SaveList.vue`

```vue
<SideBar ref="authGrantSb">
    <h1>授权管理</h1>
    <template v-if="editingSave?.id">
        <SwitchingTabs :texts="['查看', '编辑', '另存']">
            <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.View" />
            <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.Edit" />
            <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.Fork" />
        </SwitchingTabs>
        <div class="smallNote globalAgNote">
            注：可以在"顶部栏-用户-个人授权管理"中配置自己的全局默认设置，此处的设置仅对当前存档有效（判断时优先于全局设置）
        </div>
    </template>
</SideBar>
```

---

## 9. 字段含义总结

| 字段 | 类型 | 含义 |
|---|---|---|
| `Id` | `int` | 主键 |
| `On` | `AuthGrantOn` | 被授权的资源类型（Save/SaveFolder/UserFile） |
| `OnId` | `int` | 被授权的资源 ID；为 0 表示这是“创建者的全局设置” |
| `To` | `AuthGrantTo` | 授权主体类型（All/AllMembers/User 等） |
| `ToId` | `int` | 当 `To = User` 时，指定用户 ID；泛指时为 0 |
| `Type` | `byte` | 操作类型（View/Edit/Fork 等），由具体资源类型的 enum 定义 |
| `Flag` | `bool` | `true` 表示允许，`false` 表示拒绝 |
| `UserId` | `int` | 仅全局设置时使用，表示该规则归属的用户；与 `OnId` 互斥 |
| `Priority` | `byte` | 优先级，数值小的先匹配，后匹配的规则覆盖先匹配的 |
| `LastActive` | `DateTime` | 最后活跃时间（通用字段） |
| `Deleted` | `bool` | 软删除标记 |

---

## 10. 关键文件索引

| 文件路径 | 说明 |
|---|---|
| `AARC.WebApi/Models/DbModels/Identities/AuthGrant.cs` | 核心模型与枚举 |
| `AARC.WebApi/Models/DbModels/Enums/AuthGrantTypes/AuthGrantTypeOfSave.cs` | Save 操作类型枚举 |
| `AARC.WebApi/Models/Db/Context/AarcContext.cs` | EF Core 上下文 |
| `AARC.WebApi/Repos/Identities/AuthGrantRepo.cs` | 数据访问层 |
| `AARC.WebApi/Controllers/Identities/AuthGrantController.cs` | API 控制器 |
| `AARC.WebApi/Services/Identities/AuthGrants/AuthGrantCheckService.cs` | 权限计算核心 |
| `AARC.WebApi/Services/Identities/AuthGrants/AuthGrantOwnerService.cs` | 资源所有者查询 |
| `AARC.WebApi/Controllers/Saves/SaveController.cs` | Save 业务权限调用 |
| `AARC.WebApi/Controllers/Saves/SaveSvgController.cs` | SVG 上传权限调用 |
| `AARC.WebApi/Controllers/Saves/SaveRecommendController.cs` | 推荐公开可编辑存档 |
| `AARC.WebApi/Services/Saves/SaveDtoEnrichService.cs` | DTO 权限字段填充 |
| `AARC.WebApi/Controllers/System/SudoController.cs` | 管理员批量清理授权 |
| `AARC.WebApi/Repos/Repo.cs` | 基类与优先级扩展方法 |
| `aarc/src/app/com/apiGenerated.ts` | 前端生成的 API 类型 |
| `aarc/src/app/com/apiStore.ts` | 前端 API 客户端注册 |
| `aarc/src/pages/components/AuthGrantEdit.vue` | 前端权限编辑组件 |
| `aarc/src/pages/identities/UserList.vue` | 全局授权管理入口 |
| `aarc/src/pages/saves/components/SaveList.vue` | 单个存档授权管理 |
| `aarc/src/app/topbar/topbarData.ts` | 顶部栏“个人授权管理”入口 |
| `aarc/src/app/localConfig/userListLocalConfig.ts` | 本地状态 `openingSelfEdit` |
