export async function checkUrlIsImage(url: string): Promise<string | undefined> {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        if (!res.ok)
            return "加载失败"
        const type = res.headers.get("Content-Type")
        if (!type)
            return "链接异常"
        if (!type.startsWith("image"))
            return "链接非图片"
    }
    catch (error) {
        return "加载失败"
    }
}