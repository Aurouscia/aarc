# 调色盘内置色库
## 目录结构
```
palette
├ palette.ts        汇总（自动生成）
├ paletteGen.ts     汇总生成脚本
├ real              现实城市目录
│ ├ 000-xyz.ts        超知名城市（北上广深、东京、巴黎级）
│ ├ 100-xyz.ts        特知名城市（杭州、武汉、墨尔本、罗马级）
│ └ 200-xyz.ts        较知名城市（其他）
└ fic               架空城市目录
  ├ 000-xyz.ts        超知名作品
  ├ 100-xyz.ts        特知名作品
  └ 200-xyz.ts        较知名作品
```

## 数据ts命名规则
- 数据ts文件名称：`三位数优先级-城市名.ts`或`三位数优先级-城市名-公司名.ts`  
- 数据ts文件内容的一行：`颜色名 : 16进制颜色值`
- “非官方”的颜色名，便于过滤：前面加个星号`*`
```ts
//示例：
export default `
1号线 : #ff0000
2号线 : #ff00ff
*3号线 ：#00ffff
`
```

## 优先级
优先级由本项目贡献者以“常用程度”主观决定，并不代表任何实际排名

## palette.ts
- 如果添加/删除/重命名了`数据ts文件`，需要使用命令`npm run paletteGen`自动更新`palette.ts`  
- 如果`palette.ts`有更新，必须与`数据ts文件`的更新在同一个commit里提交 

使用方法：
```ts
import { real, fic } from '@/data/palette/palette'
```
其中real和fic分别代表现实城市和架空作品