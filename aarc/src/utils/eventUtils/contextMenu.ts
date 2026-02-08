export function enableContextMenu(timeoutMs?:number){
    const task = ()=>{
        console.log('已允许右键/长按')
        document.oncontextmenu = null
    }
    if(typeof timeoutMs == 'number'){
        window.setTimeout(task, timeoutMs)
    }else{
        task()
    }
}
export function disableContextMenu(){
    console.log('已禁止右键/长按')
    document.oncontextmenu = (e)=>{
        e.preventDefault()
    }
}