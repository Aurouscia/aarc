const units = ['B', 'K', 'M', 'G', 'T'] as const;
const base = 1024;

export function dataSizeStr(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) {
        return '-';
    }
    if (bytes === 0) {
        return '0B';
    }
    const exp = Math.min(
        Math.floor(Math.log(bytes) / Math.log(base)),
        units.length - 1
    );
    const value = bytes / Math.pow(base, exp);
    const digits = value < 10 && !Number.isInteger(value) ? 1 : 0;
    return value.toFixed(digits) + units[exp];
}
