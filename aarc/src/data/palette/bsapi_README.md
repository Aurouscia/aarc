# API README — `GET binshu.jowei19.com/api/getcolorsets`

---

## 调用方式

```
GET binshu.jowei19.com/api/getcolorsets?clientVersion={number}
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `clientVersion` | `int` | 否 | `0` | 客户端当前持有的版本号 |

---

## 响应

### 版本已是最新（`clientVersion >= 服务端版本`）

```
HTTP 200
""
```

返回空字符串，客户端无需更新本地数据。

---

### 有新版本（`clientVersion < 服务端版本`）

```json
HTTP 200
{
  "version": 3,
  "content": [
    { "name": "sunset",  "pri": 1,   "data": "..." },
    { "name": "ocean",   "pri": 2,   "data": "..." },
    { "name": "broken",  "pri": 999, "data": "..." }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | `int` | 服务端当前版本号，客户端应存储并在下次请求时带上 |
| `content` | `array` | colorset 列表 |
| `content[].name` | `string` | colorset 名称，取自文件名 `-` 右侧部分 |
| `content[].pri` | `int` | 排列优先级，取自文件名 `-` 左侧部分；非数字或无 `-` 时降级为 `999` |
| `content[].data` | `string` | 文件原始文本内容 |

---

## 文件命名约定

服务端读取 `colorsets/` 目录（递归），文件名格式必须为：

```
{pri}-{name}.{ext}
```

- `pri`：整数，表示排列优先级，数字越小越靠前
- `name`：colorset 名称，可包含任意字符（除首个 `-` 外）
- 若 `pri` 部分无法解析为整数，或文件名中不含 `-`，则 `pri` 自动赋值为 `999`

示例：

```
colorsets/
├── 1-sunset.txt        → pri: 1,   name: "sunset"
├── 2-ocean.txt         → pri: 2,   name: "ocean"
├── 10-forest.txt       → pri: 10,  name: "forest"
└── legacy.txt          → pri: 999, name: "legacy"
```

---

## 版本管理

服务端版本号为静态字段 `_version`，修改 colorsets 文件内容后需手动递增。

客户端流程：
1. 本地存储 `version`，初次请求传 `clientVersion=0`
2. 收到空字符串 → 版本未变，使用本地缓存
3. 收到完整数据 → 整体替换本地缓存，并更新存储的 `version`

---
