function isTruthyEnv(value: unknown): boolean {
    if (value === undefined || value === null || value === '') {
        return false
    }
    const s = String(value).toLowerCase()
    return s !== 'false' && s !== '0' && s !== 'no' && s !== 'off'
}

export const apiBaseUrl = (import.meta.env.VITE_ApiUrlBase as string | undefined)?.trim()

export const oidcAuthority = (import.meta.env.VITE_OidcAuthority as string | undefined)?.trim()

export const oidcEnabled = !!oidcAuthority

export const hideLocalAuth = isTruthyEnv(import.meta.env.VITE_HideLocalAuth)
