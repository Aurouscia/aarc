import { useApiStore } from "@/app/com/apiStore";
import { useMainCvsDispatcher } from "@/models/cvs/dispatchers/mainCvsDispatcher";

export async function renderAndUploadCloudSvg(saveId: number): Promise<boolean> {
    const api = useApiStore()
    const mainCvsDispatcher = useMainCvsDispatcher()
    try {
        const svgBlob = await mainCvsDispatcher.renderMainCvsToSvgBlob({
            withAds: 'no',
            withBgRefImage: false,
            withGridLayer: 'none'
        })
        const res = await api.saveSvg.upload(saveId, {data: svgBlob, fileName: 'latest.svg'})
        return res === true
    } catch (e) {
        console.error('渲染或上传云端SVG失败', e)
        return false
    }
}
