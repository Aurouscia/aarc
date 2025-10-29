import { defineStore } from "pinia";
import { ref } from "vue";

export const useNameSearchStore = defineStore('nameSearch', ()=>{
    const show = ref(false)
    return { show }
})