import { ColorProcInvBinary } from "@/utils/colorUtils/colorProc/colorProcInvBinary";
import { ColorProcLineExtend } from "@/utils/colorUtils/colorProc/colorProcLineExtend";
import { ColorProcTerrainTag } from "@/utils/colorUtils/colorProc/colorProcTerrainTag";
import { ColorProcDownplay } from "@/utils/colorUtils/colorProc/colorProcDownplay";
import { defineStore } from "pinia";

export const useColorProcStore = defineStore('colorProc', ()=>{
    const colorProcLineExtend = new ColorProcLineExtend()
    const colorProcInvBinary = new ColorProcInvBinary()
    const colorProcTerrainTag = new ColorProcTerrainTag()
    const colorProcDownplay = new ColorProcDownplay()
    return { colorProcLineExtend, colorProcInvBinary, colorProcTerrainTag, colorProcDownplay }
})