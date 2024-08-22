import { defineStore } from "pinia";
import { ref } from "vue";
import { Save } from "../save";

export const useSaveStore = defineStore('save', () => {
    const save = ref<Save>()
    function getNewId() {
        if(!save.value)
            throw Error("找不到存档")
        const current = save.value.idIncre;
        save.value.idIncre += 1
        return current
    }

    return { save, getNewId }
})