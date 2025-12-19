import { Line } from "@/models/save"

/** 对线路按名称排序（如果以数字开头，则按其数字升序排序，有数字的排在没数字的前面） */
export default function sortLinesByName(lines: Line[]) {
    lines.sort((a,b)=>{
        const aNum = parseInt(a.name)
        const bNum = parseInt(b.name)
        if(isNaN(aNum) && isNaN(bNum))
            return a.name.localeCompare(b.name)
        if(isNaN(aNum))
            return 1
        if(isNaN(bNum))
            return -1
        return aNum - bNum
    })
}