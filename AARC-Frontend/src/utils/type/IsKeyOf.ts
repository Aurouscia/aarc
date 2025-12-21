export function isKeyOf<T extends object>(
    k: PropertyKey,
    o: T
): k is keyof T {
    return k in o;
}