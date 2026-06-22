import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { convertToProxyUrlIfNeeded, restoreUrlFromProxyIfNeeded } from '@/utils/urlUtils/proxyUrl'

describe('convertToProxyUrlIfNeeded', () => {
    beforeEach(() => {
        vi.stubGlobal('window', undefined)
        vi.stubEnv('VITE_ApiUrlBase', 'http://localhost:5250')
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    it('相对路径应原样返回', () => {
        expect(convertToProxyUrlIfNeeded('/icons/train.svg', 'icon')).toBe('/icons/train.svg')
    })

    it('Node 环境（无 window）应原样返回', () => {
        const url = 'http://example.com/icon.svg'
        expect(convertToProxyUrlIfNeeded(url, 'icon')).toBe(url)
    })

    it('同源 URL 应原样返回', () => {
        vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
        const url = 'http://localhost:3000/icons/train.svg'
        expect(convertToProxyUrlIfNeeded(url, 'icon')).toBe(url)
    })

    it('跨域 http URL 应转换为代理 URL', () => {
        vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
        const url = 'http://example.com/icons/train.svg'
        const result = convertToProxyUrlIfNeeded(url, 'icon')
        expect(result).toBe('http://localhost:5250/proxy/icon/http%3A%2F%2Fexample.com%2Ficons%2Ftrain.svg')
    })

    it('跨域 https URL 应转换为代理 URL', () => {
        vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
        const url = 'https://cdn.example.com/data.json'
        const result = convertToProxyUrlIfNeeded(url, 'json')
        expect(result).toBe('http://localhost:5250/proxy/json/https%3A%2F%2Fcdn.example.com%2Fdata.json')
    })
})

describe('restoreUrlFromProxyIfNeeded', () => {
    it('应将相对代理 URL 还原为原始 URL', () => {
        const content = '<image href="/proxy/icon/http%3A%2F%2Faarc.jowei19.com%2Ficons%2Fa%2Ftrain.svg" />'
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toBe('<image href="http://aarc.jowei19.com/icons/a/train.svg" />')
    })

    it('应将绝对代理 URL 还原为原始 URL', () => {
        const content = '<image href="http://localhost:5250/proxy/icon/http%3A%2F%2Faarc.jowei19.com%2Ficons%2Fa%2Ftrain.svg" />'
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toBe('<image href="http://aarc.jowei19.com/icons/a/train.svg" />')
    })

    it('应支持 json 类型代理 URL', () => {
        const content = 'url="/proxy/json/https%3A%2F%2Fexample.com%2Fdata.json"'
        const result = restoreUrlFromProxyIfNeeded(content, 'json')
        expect(result).toBe('url="https://example.com/data.json"')
    })

    it('应处理单引号属性', () => {
        const content = "<image href='/proxy/icon/http%3A%2F%2Fexample.com%2Ficon.svg' />"
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toBe("<image href='http://example.com/icon.svg' />")
    })

    it('无代理 URL 时应原样返回', () => {
        const content = '<image href="http://example.com/icon.svg" />'
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toBe(content)
    })

    it('多个代理 URL 时应全部还原', () => {
        const content = `
            <image href="/proxy/icon/http%3A%2F%2Fexample.com%2Fa.svg" />
            <image href="/proxy/icon/http%3A%2F%2Fexample.com%2Fb.svg" />
        `
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toContain('href="http://example.com/a.svg"')
        expect(result).toContain('href="http://example.com/b.svg"')
        expect(result).not.toContain('/proxy/icon/')
    })

    it('解码失败时应保留原内容', () => {
        const content = '<image href="/proxy/icon/%" />'
        const result = restoreUrlFromProxyIfNeeded(content, 'icon')
        expect(result).toBe(content)
    })
})
