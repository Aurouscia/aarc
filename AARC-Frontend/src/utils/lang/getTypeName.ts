export function getTypeName<T>(value: T): string|undefined {
    if(value?.constructor)
        return value.constructor.name;
}