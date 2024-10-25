import { sqrt2 } from "@/utils/consts"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { Config } from "../config"
import { useSaveStore } from "./saveStore"

export const configDefault:Config = {
    bgColor: '#eeeeee',

    lineWidth: 14,
    lineTurnAreaRadius: 20,

    ptBareSize: 16,
    ptBareLineWidth: 4,
    ptBareLineColor: '#999999',
    ptBareLineColorSelected: '#000000',
    ptStaSize: 10,
    ptStaLineWidth: 4,
    ptStaFillColor: '#ffffff',
    ptStaExchangeLineColor: '#999999',

    staNameFontSize: 26,
    staNameFont: 'microsoft YaHei',
    staNameRowHeight: 30,
    staNameColor: '#000000',
    staNameSubFontSize: 18,
    staNameSubFont: 'microsoft YaHei',
    staNameSubRowHeight: 20,
    staNameSubColor: '#888888',

    gridMainLineColor: '#999999',
    gridSubLineColor: '#aaaaaa',

    clickPtThrs: 24,
    clickLineThrs: 12,

    cursorSize: 14,
    cursorLineWidth: 4,

    snapOctaClingPtPtDist: 25,
    snapOctaClingPtNameDist: 16,
    snapOctaRayPtPtThrs: 16,
    snapOctaClingPtPtThrs: 10,
    snapOctaClingPtNameThrs: 8,
    snapOctaRayPtNameThrs: 6,
    snapGridThrs: 6
}

export const useConfigStore = defineStore('config', ()=>{
    const config = ref<Config>(configDefault)
    const saveStore = useSaveStore()
    function readConfigFromSave(){
        if(!saveStore.save?.config)
            return;
        const sc = saveStore.save.config;
        Object.assign(config.value, sc)
    }

    const staNameFontStr = computed<string>(()=>
        `${config.value.staNameFontSize}px ${config.value.staNameFont}`)
    const staNameFontSubStr = computed<string>(()=>
        `${config.value.staNameSubFontSize}px ${config.value.staNameSubFont}`)
    const clickPtThrsSq = computed<number>(()=>
        config.value.clickPtThrs ** 2)
    const clickLineThrsSq = computed<number>(()=>
        config.value.clickLineThrs ** 2)
    const clickLineThrs_sqrt2_sq = computed<number>(()=>
        (config.value.clickLineThrs * sqrt2) ** 2) 
    const snapOctaClingPtPtThrsSq = computed<number>(()=>
        config.value.snapOctaClingPtPtThrs ** 2)
    const snapOctaClingPtNameThrsSq = computed<number>(()=>
        config.value.snapOctaClingPtNameThrs ** 2)
    
    return { 
        config, readConfigFromSave,
        staNameFontStr, staNameFontSubStr,
        clickPtThrsSq, clickLineThrsSq, clickLineThrs_sqrt2_sq, 
        snapOctaClingPtPtThrsSq, snapOctaClingPtNameThrsSq
    }
})