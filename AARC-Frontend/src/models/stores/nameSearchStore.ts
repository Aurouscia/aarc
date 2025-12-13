import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useEnvStore } from "./envStore";

export const useNameSearchStore = defineStore('nameSearch', ()=>{
    const showPrivate = ref(false)
    const show = computed(()=>showPrivate.value)
    const searchText = ref<string>()
    const searchInput = ref<HTMLInputElement>()
    const showResults = computed(()=>{
        return show.value && !!searchText.value?.trim()
    })

    function init(searchInputElement:HTMLInputElement){
        searchInput.value = searchInputElement
    }
    function toggleShow(force?:boolean|string){
        if(force === undefined){
            force = !showPrivate.value
        }
        if(force){
            if(typeof force === 'string'){
                searchText.value = force
            }
        }
        else{
            searchText.value = ''
        }
        const newValueOfShow = !!force
        if(newValueOfShow){
            searchInput.value?.focus()
            const envStore = useEnvStore()
            envStore.endEveryEditing({rerenderIfEdited:true})
            envStore.cancelActive()
        }
        showPrivate.value = newValueOfShow
    }
    return { show, searchText, searchInput, showResults, toggleShow, init }
})