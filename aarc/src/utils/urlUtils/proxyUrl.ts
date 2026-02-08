/**
 * 按需进行代理url转换（如果同源则不转换）  
 * 参考：AARC-Backend/Controllers/System/ProxyController.cs
 * @param url 原url
 * @param type 代理类型
 * @returns 代理url
 */
export function convertToProxyUrlIfNeeded(url: string, type:'icon') {
    if (url.startsWith('/'))
        return url
    const origin = window.location.origin
    if (url.startsWith(origin)) {
        return url
    }
    const encoded = encodeURIComponent(url)
    const baseUrl = import.meta.env.VITE_ApiUrlBase
    return `${baseUrl}/proxy/${type}/${encoded}`
}