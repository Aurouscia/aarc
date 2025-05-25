/**
 * 从一个对象中复制所有属性到另一个对象中，除了指定的排除属性
 * @param target 目标对象
 * @param source 源对象
 * @param exceptProps 要排除的属性数组
 * @returns void
 */
export function assignAllProps<T extends object>(target: T, source:T, exceptProps?:(Extract<keyof T, string>)[]): void {
    for (const key in source) {
        if (!exceptProps?.includes(key)) {
            target[key] = source[key];
        }
    }
}