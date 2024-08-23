import { defineStore } from "pinia";
import { ref } from "vue";

export const useEnvStore = defineStore('env', ()=>{
    const mode = ref<"none"|"line">("none")
    const activeId = ref<number>(-1)
    return { mode, activeId }
})