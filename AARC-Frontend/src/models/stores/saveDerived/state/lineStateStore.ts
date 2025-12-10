import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { useConfigStore } from "../../configStore";
import { Line } from "@/models/save";

export const useLineStateStore = defineStore('lineState', () => {
    const { save } = storeToRefs(useSaveStore())
    const configStore = useConfigStore()
    const lineActualColors = computed<Record<number, string | undefined>>(() => {
        const res: Record<number, string | undefined> = {}
        if (!save.value?.lines)
            return res
        for (const line of save.value.lines) {
            let actualColor = line.color
            if (line.colorPre) {
                actualColor = configStore.getPresetColor(line.colorPre)
            }
            res[line.id] = actualColor
        }
        return res
    })
    function getLineActualColor(line:Line) {
        return lineActualColors.value[line.id] || line.color
    }
    function getLineActualColorById(lineId:number){
        return lineActualColors.value[lineId]
    }
    return {
        getLineActualColor,
        getLineActualColorById
    }
})