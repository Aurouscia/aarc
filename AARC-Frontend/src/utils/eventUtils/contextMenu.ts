export function enableContextMenu(){
    document.oncontextmenu = null
}
export function disableContextMenu(){
    document.oncontextmenu = (e)=>{
        e.preventDefault()
    }
}