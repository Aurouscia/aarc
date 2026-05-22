# aarc 前端

## 安装依赖项

使用符合版本要求的 pnpm （注意 package.json 中的 "engines" 属性）

```sh
pnpm install --frozen-lockfile
```

## 语法检查

进行任何修改后，都要运行一次

```sh
pnpm type-check
```

## vue 组件

任何 vue 组件，全部使用 `script-template-style` 的顺序

- script 统一使用 `<script setup lang="ts">`
- style 统一使用 `<style scoped lang="scss">` 嵌套语法