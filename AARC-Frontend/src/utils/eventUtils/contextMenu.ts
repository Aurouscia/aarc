export function enableContextMenu(){
    console.log('已允许右键/长按')
    document.oncontextmenu = null
}
export function disableContextMenu(){
    console.log('已禁止右键/长按')
    document.oncontextmenu = (e)=>{
        e.preventDefault()
    }
}