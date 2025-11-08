import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useEnvStore } from "./envStore";

export const useNameSearchStore = defineStore('nameSearch', ()=>{
    const showPrivate = ref(false)
    const show = computed(()=>showPrivate.value)
    const searchText = ref<string>()
    const searchInput = ref<HTMLInputElement>();
    const showResults = computed(()=>{
        return show.value && !!searchText.value?.trim()
    })
    function toggleShow(force?:boolean|string){
        if(force === undefined){
            force = !showPrivate.value
        }
        if(force){
            const envStore = useEnvStore()
            envStore.cancelActive()
            envStore.endEveryEditing({rerenderIfEdited:true})
            if(typeof force === 'string'){
                searchText.value = force
            }
            searchInput.value?.focus()
        }
        else{
            searchText.value = ''
        }
        showPrivate.value = !!force
    }
    return { show, searchText, searchInput, showResults, toggleShow }
})