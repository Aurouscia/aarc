export type AllKeysOptional<T> = {
    [Property in keyof T]+?: T[Property]
}