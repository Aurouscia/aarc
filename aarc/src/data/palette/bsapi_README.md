# FilesController API 文档

静态文件服务接口，挂载于 ASP.NET Core，所有接口均允许跨域（`AllowMySubdomains` 策略）。

---

## 数据结构约定

### 文件命名规范

接口所服务的文件均存放于 `wwwroot/` 下的某个目录。文件名格式约定如下：

```
<pri>-<name>.<ext>
```

| 字段 | 说明 |
|------|------|
| `pri` | 整数，表示排序优先级，数值越小越靠前。`>= 500` 约定为"虚构/非官方"类目 |
| `name` | 人类可读名称，可包含中文、空格等 |
| `ext` | 文件扩展名（如 `.txt`） |

示例：`023-中国铁路.txt`、`512-架空世界线.txt`

若文件名中不含 `-`，则整个文件名视为 `name`，`pri` 默认为 `0`。

---

### 颜色集文件格式（`.txt`）

```
<关键词行（第一行，用于搜索）>
<颜色名>:<十六进制颜色值>
<颜色名>:<十六进制颜色值>
...
```

- 第一行为关键词/标题行，客户端用于搜索过滤，不作为颜色条目解析
- 从第二行起，每行格式为 `名称:颜色`，以 `:` 分隔
- 名称中含 `*` 表示非官方色，客户端在严格模式下会过滤掉
- 名称中可含括号表示副名，如 `赤(あか):#FF0000`，括号内为副名
- 颜色值为十六进制，如 `#FF0000`

示例：

```
中国铁路 railway china
普速红:＃C0392B
高铁银*:#BDC3C7
动车蓝(动卧):#1A5276
```

---

## 接口列表

所有接口均为 `GET`，Base URL 视部署环境而定，下文以 `http://binshu.jowei19.com` 为例。

### 公共查询参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | string | `""` | 相对于 `wwwroot/` 的目录路径，空字符串表示根目录 |
| `recursive` | bool | `false` | 是否递归遍历子目录 |

路径会经过安全校验，禁止路径穿越（返回 `400`），目录不存在返回 `404`。

---

### GET `/api/filenames`

返回指定目录下所有文件的**文件名**列表。

非递归时返回纯文件名（含扩展名）；递归时返回相对于 `path` 的相对路径。

**请求示例**
```
GET /api/filenames?path=colorsets&recursive=false
```

**响应示例**
```json
[
  "023-中国铁路.txt",
  "045-日本地铁.txt",
  "512-架空世界线.txt"
]
```

---

### GET `/api/fileurls`

返回指定目录下所有文件的**完整可访问 URL** 列表，协议和域名取自当前请求。

URL 格式为 `{scheme}://{host}/colorsets/{相对路径}`，路径分隔符统一为正斜杠。

**请求示例**
```
GET /api/fileurls?path=colorsets&recursive=true
```

**响应示例**
```json
[
  "http://binshu.jowei19.com/colorsets/023-中国铁路.txt",
  "http://binshu.jowei19.com/colorsets/subdir/045-日本地铁.txt"
]
```

---

### GET `/api/filecontents`

返回指定目录下所有文件的**文件名（不含扩展名）与文件内容**列表，一次性全量返回。

**请求示例**
```
GET /api/filecontents?path=colorsets&recursive=true
```

**响应示例**
```json
[
  {
    "filename": "023-中国铁路",
    "content": "中国铁路 railway china\n普速红:#C0392B\n高铁银*:#BDC3C7\n"
  },
  {
    "filename": "045-日本地铁",
    "content": "..."
  }
]
```

---

### GET `/api/filecontents/versioned`

带版本控制的全量内容接口。客户端传入本地持有的版本号，服务器判断是否需要下发新数据。

**额外查询参数**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `clientVersion` | int | `0` | 客户端当前持有的数据版本号 |

**服务器端版本号**

版本号为 `FilesController` 中的静态字段 `_version`（`int`，初始值 `1`）。每次文件内容有更新时，手动递增该字段并重新部署。

**逻辑**

- `clientVersion < _version`：返回完整数据及当前版本号
- `clientVersion >= _version`：返回空字符串 `""`，表示客户端数据已是最新，无需更新

**请求示例**
```
GET /api/filecontents/versioned?path=colorsets&recursive=true&clientVersion=2
```

**响应示例（有更新）**
```json
{
  "version": 3,
  "content": [
    {
      "filename": "023-中国铁路",
      "content": "中国铁路 railway china\n普速红:#C0392B\n"
    },
    {
      "filename": "045-日本地铁",
      "content": "..."
    }
  ]
}
```

**响应示例（无更新）**
```
""
```

---

## 客户端缓存策略（前端约定）

前端（Vue）配合 `/api/filecontents/versioned` 使用如下策略：

1. 从 `localStorage`（key: `bsapi_colorsets_cache`）读取 `{ version, content }`，若不存在则 `version = 0`
2. 携带 `clientVersion` 请求 versioned 接口（超时 5 秒）
   - 返回完整数据 → 写入 `localStorage`，用新数据渲染
   - 返回 `""` → 版本未落后，直接用 `localStorage` 中的旧数据渲染
   - 请求失败 → 静默，走下一步
3. `localStorage` 有数据 → 用缓存渲染
4. 兜底 → 使用项目内置静态数据

---

## 错误响应

| HTTP 状态码 | 含义 |
|-------------|------|
| `400 Bad Request` | `path` 参数存在路径穿越，或指向 `wwwroot` 之外 |
| `404 Not Found` | 指定目录不存在 |