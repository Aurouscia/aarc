# Files API

基于 ASP.NET Core 的静态文件目录查询 API，提供文件名列表与可访问 URL 列表两个接口，支持递归遍历子目录。
默认路径：binshu.jowei19.com
---

## 接口一览

| 接口 | 说明 |
|------|------|
| `GET /api/filenames` | 返回指定目录下的文件名列表 |
| `GET /api/fileurls` | 返回指定目录下文件的完整可访问 URL 列表 |

---

## GET /api/filenames

返回指定目录下的**文件名**列表（非递归时仅文件名，递归时为相对路径）。

### Query 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | string | `""` | 相对于 wwwroot 的目录路径 |
| `recursive` | bool | `false` | 是否递归遍历子目录 |

### 示例

**请求**
```
GET /api/filenames?path=colorsets&recursive=false
```

**响应**
```json
[
  "000-北京.txt",
  "001-上海.txt",
  "500-架空城市.txt"
]
```

**递归请求**
```
GET /api/filenames?path=colorsets&recursive=true
```

**响应**
```json
[
  "000-北京.txt",
  "001-上海.txt",
  "sub/100-广州.txt"
]
```

---

## GET /api/fileurls

返回指定目录下文件的**完整可访问 URL** 列表，路径格式为 `colorsets/{文件名或相对路径}`，域名取自当前请求的 Host。

### Query 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `path` | string | `""` | 相对于 wwwroot 的目录路径 |
| `recursive` | bool | `false` | 是否递归遍历子目录 |

### 示例

**请求**
```
GET /api/fileurls?path=colorsets&recursive=true
```

**响应**
```json
[
  "http://binshu.jowei19.com/colorsets/000-北京.txt",
  "http://binshu.jowei19.com/colorsets/001-上海.txt",
  "http://binshu.jowei19.com/colorsets/sub/100-广州.txt"
]
```

返回的每条 URL 可直接用于 `fetch()`，无需客户端再拼接域名。

---

## 错误响应

| HTTP 状态码 | 原因 |
|-------------|------|
| `400 Bad Request` | `path` 参数尝试访问 wwwroot 以外的目录（路径穿越） |
| `404 Not Found` | 指定目录不存在 |