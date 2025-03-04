export class DocumentHiddenLongWatcher{
    hideTime:number = 0
    hideTimeThrsMs:number
    exceededCallback:()=>void
    constructor(hideTimeThrsMs:number, exceededCallback:()=>void){
        this.hideTimeThrsMs = hideTimeThrsMs
        this.exceededCallback = exceededCallback
    }
    startWatching() {
        document.addEventListener('visibilitychange', this.handlerBinded)    
    }
    stopWatching(){
        document.removeEventListener('visibilitychange', this.handlerBinded)
    }
    handler(){
        const state = document.visibilityState
        const now = Date.now()
        if(state==='hidden'){
            this.hideTime = now
        }else{
            const hiddenFor = now - this.hideTime
            if(hiddenFor > this.hideTimeThrsMs){
                this.exceededCallback()
            }
        }
    }
    handlerBinded = this.handler.bind(this)
}