import { fileSizeDisplay } from "../dataUtils/fileSizeDisplay"

export async function checkUrlIsImage(url: string, sizeLimit: number): Promise<string | undefined> {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        if (!res.ok)
            return "加载失败"
        const type = res.headers.get("Content-Type")
        if (!type)
            return "链接异常"
        if (!type.startsWith("image"))
            return "链接非图片"
        const length = parseInt(res.headers.get("Content-Length") ?? '')
        if (isNaN(length))
            return "链接异常"
        if (length > sizeLimit)
            return `不可大于${fileSizeDisplay(sizeLimit)}`
    }
    catch (error) {
        return "加载失败"
    }
}