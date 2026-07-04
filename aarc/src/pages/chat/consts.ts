export const SECOND_MS = 1000
export const MINUTE_MS = 60 * SECOND_MS

export const KICK_PROMPT_WAIT_MS = 20 * SECOND_MS
export const KICK_TAKEOVER_WAIT_MS = 20 * SECOND_MS
export const KICK_IDLE_THRESHOLD_MS = 1 * MINUTE_MS // 10 * MINUTE_MS
export const KICK_INFO_REFRESH_MS = 20 * SECOND_MS // 30 * SECOND_MS

export const SAVE_REMINDER_INTERVAL_MS = 30 * SECOND_MS // 10 * MINUTE_MS
export const SAVE_REMINDER_EARLY_MS = 10 * SECOND_MS // 1 * MINUTE_MS
export const SAVE_REMINDER_DELAY_MS = SAVE_REMINDER_INTERVAL_MS - SAVE_REMINDER_EARLY_MS

export function secText(ms: number) {
    return `${ms / SECOND_MS}秒`
}

export function minText(ms: number) {
    return `${ms / MINUTE_MS}分钟`
}
