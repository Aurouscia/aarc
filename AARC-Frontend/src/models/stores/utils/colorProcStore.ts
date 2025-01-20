import { ColorProcInvBinary } from "@/utils/colorUtils/colorProc/colorProcInvBinary";
import { ColorProcLineExtend } from "@/utils/colorUtils/colorProc/colorProcLineExtend";
import { defineStore } from "pinia";

export const useColorProcStore = defineStore('colorProc', ()=>{
    const colorProcLineExtend = new ColorProcLineExtend()
    const colorProcInvBinary = new ColorProcInvBinary()
    return { colorProcLineExtend, colorProcInvBinary }
})