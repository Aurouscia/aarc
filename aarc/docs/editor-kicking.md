# 编辑器“请出/接管”功能说明

## 1. 功能概述

为防止某个用户长期无保存操作却持续占用存档编辑权，存档所有者可以在满足条件时，通过聊天面板中的“请出”功能将当前占用者强制请出，并接管编辑权。

该功能同时依赖后端心跳机制与前端 SignalR 实时通信。

---

## 2. 核心概念

| 术语 | 说明 |
|---|---|
| `HeartbeatAt` / `HeartbeatUserId` | 后端 `Save` 表字段，表示当前谁在编辑、最后一次心跳时间。 |
| `LastActive` / `LastActiveUnix` | 后端 `Save` 表字段，表示最后一次保存数据的时间。 |
| 占用判断 | 若 `HeartbeatUserId != 0` 且 `DateTime.Now - HeartbeatAt < 10 分钟`，则认为该用户正在编辑。 |
| 请出判断 | 以 **保存时间**（`LastActive`）为准，而不是心跳时间，防止恶意用户只发心跳不保存。 |

---

## 3. 后端实现

### 3.1 `SaveRepo.Kick(int id)`

位置：`AARC.WebApi/Repos/Saves/SaveRepo.cs`

功能：
- 校验存档存在。
- 校验请求者是存档所有者。
- 校验请求者不是当前编辑者（若已是，则无需接管）。
- **不检查 `LastActive`**：因为从前端发起“请出”到真正调用 `Kick` 之间，被踢用户可能又保存了一次；空闲时间检查只由前端负责。
- 将 `HeartbeatAt` 设为当前时间，`HeartbeatUserId` 设为请求者，完成强制接管。

### 3.2 `ChatHub` 编辑者加入时间记录

位置：`AARC.WebApi/Services/Chat/ChatHub.cs`

- 静态字典 `_editorJoinedAt: ConcurrentDictionary<int, DateTime>`，以存档 Id 为键，记录当前编辑者加入聊天房间的时间。
- 在 `JoinRoom` 中，如果加入者的 `user.Id` 等于该存档的 `HeartbeatUserId`，则记录/刷新该时间。
- 提供 `GetEditorJoinedAt(int saveId)` 方法，返回该时间的 Unix 毫秒时间戳；未记录时返回 `null`。

### 3.3 `ChatHub.NotifyKickEditingUser(string roomName)`

位置：`AARC.WebApi/Services/Chat/ChatHub.cs`

- SignalR 方法，供存档所有者在前端点击“请出”后调用。
- 向整个房间广播 `KickEditingUser` 事件，使当前编辑者弹出保存并退出提示。
- 仅做广播，不修改数据库。

### 3.4 `SaveController.Kick(int id)`

位置：`AARC.WebApi/Controllers/Saves/SaveController.cs`

- HTTP POST 接口：`/api/Save/Kick`
- 通过 `EnsureOwner` 再次确认所有者权限。
- 调用 `saveRepo.Kick(id)`，完成强制接管。

---

## 4. 前端实现

### 4.1 文件结构

| 文件 | 职责 |
|---|---|
| `aarc/src/pages/chat/consts.ts` | 所有时间常量集中定义。 |
| `aarc/src/pages/chat/ChatRoom.vue` | 聊天主面板、被踢提示 Prompt、保存提醒 Prompt、打开 `KickingSidebar`。 |
| `aarc/src/pages/chat/KickingSidebar.vue` | “请出/接管”侧栏：显示占用信息、LastActive、接管倒计时、调用后端 Kick。 |
| `aarc/src/app/com/signalrStore.ts` | 提供 `notifyKickEditingUser`、`getEditorJoinedAt` 调用，并监听 `KickEditingUser` 事件通知当前编辑者。 |
| `aarc/src/app/globalStores/kickedFromCanvas.ts` | 持久化记录每个存档弹出“请保存并退出”提示的时间；每次读取时自动清理过期记录。 |
| `aarc/src/pages/editors/Editor.vue` | 加载存档前检查是否处于被踢宽限期；接收 `kicked` 事件，释放阻止离开提示并跳回 `kickedName`；保存成功后重置保存提醒定时器。 |

### 4.2 常量定义

位置：`aarc/src/pages/chat/consts.ts`

```typescript
SECOND_MS = 1000
MINUTE_MS = 60 * SECOND_MS

KICK_PROMPT_WAIT_MS = 20 * SECOND_MS      // 被踢用户保存并退出的宽限时间
KICK_TAKEOVER_WAIT_MS = 20 * SECOND_MS    // 所有者点击“请出”后等待接管的时间
KICK_IDLE_THRESHOLD_MS = 10 * MINUTE_MS   // 判定“长时间无保存操作”的阈值
KICK_INFO_REFRESH_MS = 30 * SECOND_MS     // LastActive 自动刷新间隔

SAVE_REMINDER_INTERVAL_MS = 10 * MINUTE_MS
SAVE_REMINDER_EARLY_MS = 1 * MINUTE_MS
SAVE_REMINDER_DELAY_MS = SAVE_REMINDER_INTERVAL_MS - SAVE_REMINDER_EARLY_MS
```

### 4.3 所有者操作流程

1. **打开占用侧栏**
   - 在聊天面板 Header 点击“请出”。
   - 打开 `KickingSidebar`。
   - 若当前用户是所有者，立即加载 `LastActive`，并启动 30 秒定时刷新。

2. **查看占用信息**
   - 显示文案：`如果用户无保存操作占用存档 10 分钟以上，你可以将其请出去`。
   - 显示 `上次保存时间：` 后接 `HH:mm:ss` 格式的时间与 `x分x秒前`，时间和 ago 部分以 19px 粗体单独展示。

3. **加载占用信息**
   - 每次加载 `loadInfo` 时，同时通过 SignalR 调用 `getEditorJoinedAt(saveId)` 获取当前编辑者加入聊天房间的时间。
   - 取 **`LastActiveUnix` 与 `editorJoinedAt` 中更晚（更近）的一个** 作为有效参考时间，用于判断是否可以请出。
   - 侧栏同时显示两个时间：
     - **大字体**：较近的那个值（较小的“多久前”）。
     - **小字体**：较远的那个值（较大的“多久前”）。
     - 例如：上次保存是 20 分钟前，编辑者 3 分钟前刚加入房间，则大字体显示 `编辑者加入时间：HH:mm:ss（3分x秒前）`，小字体显示 `存档上次保存时间：HH:mm:ss（20分x秒前）`。

4. **点击“请出”**
   - 立即重新加载 `LastActive` 与 `editorJoinedAt`。
   - 检查 `now - effectiveReferenceUnix >= KICK_IDLE_THRESHOLD_MS`：
     - **未满足**：`showPop('时间未到', 'failed')`，不进入倒计时。
     - **已满足**：
       - 通过 SignalR 调用 `NotifyKickEditingUser(roomName)`，通知当前编辑者弹出保存并退出提示。
       - 隐藏“请出”按钮，开始 20 秒倒计时，显示`已通知其离开，x 秒后强制接管`。

5. **倒计时结束**
   - 自动调用 `api.save.kick(saveId)` 强制接管存档，无需再手动点击按钮。
   - 调用 `api.save.kick(saveId)`。
   - 成功：`showPop('已接管存档', 'success')`，1 秒后 `window.location.reload()`。

### 4.4 非所有者看到的内容

- 显示文案：`如果你无保存操作占用存档 10 分钟以上，所有者可以将你请出去`。
- 不显示“请出”按钮。

### 4.5 被踢用户流程（`KickEditingUser`）

1. 所有者点击“请出”并通过空闲检查后，前端通过 SignalR 调用 `NotifyKickEditingUser(roomName)`。
2. `ChatHub` 向房间广播 `KickEditingUser` 事件。
3. 当前实际编辑者（`viewOnly === false`）收到事件后：
   - 显示 Prompt：`请在 20 秒内保存并退出`。
   - 同时调用 `kickedFromCanvasStore.markKicked(saveId)`，将当前时间持久化到 `kickedFromCanvas` Store。
   - 开始 20 秒倒计时。
4. `Editor.vue` 每次 `load()` 的最开头会检查：
   - 若 `kickedFromCanvasStore.isStillKicked(saveId, KICK_PROMPT_WAIT_MS)` 为 `true`（即当前时间仍在被踢提示出现时间 + 20 秒内），直接 `router.replace({name: kickedName})`。
   - 这防止用户在宽限期内刷新页面重新进入编辑器。
5. 倒计时结束：
   - ChatRoom 向 Editor 发射 `kicked` 事件。
   - Editor 调用 `releasePreventLeaving()`，然后 `router.replace({name: kickedName})`。

### 4.6 保存提醒

- ChatRoom 挂载后启动定时器，延迟 `SAVE_REMINDER_DELAY_MS`（9 分钟）。
- 若此时聊天功能启用（`effectiveEnabled`）且当前用户是实际编辑者（`viewOnly === false`），显示 Prompt：`已很长时间未保存，请尽快进行一次保存操作，否则 {{ x }} 秒后可能被存档所有者请出`。
- `x` 从 `SAVE_REMINDER_EARLY_MS` 开始动态倒计时（即距离真正可被请出还剩多少秒）。
- Prompt 关闭后移除倒计时定时器。
- Editor 在每次保存成功后调用 `chatRoom.value?.resetSaveReminderTimer()` 重置定时器。

---

## 5. 启用聊天的前置检查

点击“启用”按钮时，不直接启用聊天，而是先调用 `api.save.loadStatus(saveId)` 检查当前编辑者：

- 若 `editingByUserId > 0` 且不等于当前用户：
  - `showPop('只能在自己编辑时启用', 'failed')`
  - 不触发 `enable`。
- 否则才允许启用。

---

## 6. 注意事项

- `Kick` 后端接口**不检查 `LastActive`**，真正的时间门槛由前端在点击“请出”时把关。
- 请出判定基于 **保存操作** 而非心跳，避免恶意用户仅通过心跳保活。
- 当前所有时间长度均集中配置在 `aarc/src/pages/chat/consts.ts`，文本显示也通过 `secText()` / `minText()` 从常量生成，避免硬编码。
- 保存提醒与请出功能共用 `ChatRoom` 组件，但两者独立管理各自的定时器。
