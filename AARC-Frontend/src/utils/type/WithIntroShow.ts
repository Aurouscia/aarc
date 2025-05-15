/**
 * 在原有类型的基础上添加一个可选的introShow属性
 * @param T 原类型
 */
export type WithIntroShow<T extends {}> = {
    [K in keyof T]: T[K];
} & {
    introShow?:boolean
}