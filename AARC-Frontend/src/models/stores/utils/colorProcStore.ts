import { ColorProcInvBinary } from "@/utils/colorUtils/colorProc/colorProcInvBinary";
import { ColorProcLineExtend } from "@/utils/colorUtils/colorProc/colorProcLineExtend";
import { ColorProcTerrainTag } from "@/utils/colorUtils/colorProc/colorProcTerrainTag";
import { defineStore } from "pinia";

export const useColorProcStore = defineStore('colorProc', ()=>{
    const colorProcLineExtend = new ColorProcLineExtend()
    const colorProcInvBinary = new ColorProcInvBinary()
    const colorProcTerrainTag = new ColorProcTerrainTag()
    return { colorProcLineExtend, colorProcInvBinary, colorProcTerrainTag }
})