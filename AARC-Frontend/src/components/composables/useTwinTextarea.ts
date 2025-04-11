import { computed, ref, Ref } from "vue"

export function useTwinTextarea(options:{
        main:Ref<string|undefined>,
        sub:Ref<string|undefined>,
        mainMaxRow:number,
        subMaxRow:number,
        apply:()=>void,
        endEditing:()=>void
    }){
    const { main, sub, mainMaxRow, subMaxRow } = options
    const mainRows = computed<number>(()=>{
        return countChar(main.value, '\n')
    })
    const subRows = computed<number>(()=>{
        return countChar(sub.value, '\n')
    })
    const mainInput = ref<HTMLTextAreaElement>()
    const subInput = ref<HTMLTextAreaElement>()
    function countChar(str:string|undefined, char:string){
        let count = 1
        if(!str)
            return count
        for(let c of str){
            if(c===char){
                count++
            }
        }
        return count
    }
    function inputHandler(type:'main'|'sub'){
        if(type == 'main'){
            //主站名限制
            const n = main.value
            if(n){
                const rowCount = mainRows.value
                if(rowCount > mainMaxRow){
                    const idx = n.lastIndexOf('\n')
                    if(idx > 0){
                        main.value = n.slice(0, idx) + n.slice(idx + 1);
                    }
                }
            }
        }else{
            //副站名限制
            const n = sub.value
            if(n){
                const rowCount = subRows.value
                if(rowCount > subMaxRow){
                    const idx = n.lastIndexOf('\n')
                    if(idx > 0){
                        sub.value = n.slice(0, idx) + n.slice(idx + 1);
                    }
                }
            }
        }
        options.apply()
    }
    function keyHandler(e:KeyboardEvent){
        if(e.key==='Tab'){
            e.preventDefault()
            const activeEle = document.activeElement
            if(mainInput.value === activeEle){
                subInput.value?.focus()
            }else if(subInput.value === activeEle){
                mainInput.value?.focus()
            }
        }else if(e.key==="Escape"){
            e.preventDefault()
            subInput.value?.blur()
            mainInput.value?.blur()
            options.endEditing()
        }
    }
    return {
        mainInput, mainRows,
        subInput, subRows,
        inputHandler, keyHandler
    }
}