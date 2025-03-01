import { timestampS } from "./timestamp"

//部分浏览器（说的就是你，edge手机版）会在用户离开时缓存页面（自作聪明以为是个静态的内容），导致异常行为
//但要是有输入框的编辑行为貌似就不会这样，尝试模拟这种行为
export function useCachePreventer(inputEleId:string){
    let inputEle: HTMLInputElement|null = null
    let timer = 0
    function cachePreventStart(){
        const ele = document.getElementById(inputEleId)
        if(ele && 'value' in ele){
            inputEle = ele as HTMLInputElement
            timer = window.setInterval(()=>{
                const ts = timestampS()
                ele.value = ts.toString()
            }, 1000)
            inputEle.click()
            inputEle.focus()
        }
    }
    function cachePreventStop(){
        window.clearInterval(inputEleId)
    }
    return {
        cachePreventStart,
        cachePreventStop
    }
}