export type SwipeDirection = "hor"|"ver"
export type SwipeNotify = "left"|"right"|"up"|"down"
export type SwipeNotifyCallback = (n:SwipeNotify)=>void

export class SwipeListener{
    thrs:number
    dir:SwipeDirection
    target:HTMLElement
    callback:SwipeNotifyCallback
    constructor(callback:SwipeNotifyCallback, dir?:SwipeDirection, thrs?:number, target?:HTMLElement){
        this.dir = dir || "hor"
        this.thrs = thrs || 150
        this.target = target || document.body;
        this.callback = callback;
    }

    touchStartHandler: undefined | ((e:TouchEvent)=>void)
    touchLeaveHandler: undefined | ((e:TouchEvent)=>void)
    startListen(){
        const binded = this.touchHandler.bind(this)
        this.touchStartHandler = (e:TouchEvent)=>binded(e,"start")
        this.touchLeaveHandler = (e:TouchEvent)=>binded(e,"leave")
        this.target.addEventListener("touchstart",this.touchStartHandler)
        this.target.addEventListener("touchend",this.touchLeaveHandler)
    }

    stopListen(){
        this.target.removeEventListener("touchstart",this.touchStartHandler!)
        this.target.removeEventListener("touchend",this.touchLeaveHandler!)
    }

    x:number|undefined
    y:number|undefined
    touchHandler(e:TouchEvent, type:"start"|"leave"){
        const t = e.changedTouches[0]
        if(type === "start"){
            this.x = t.pageX
            this.y = t.pageY
        }
        else if(type === "leave"){
            if(this.dir=="hor" && this.x){
                if(t.pageX - this.x > this.thrs){
                    this.callback("right")
                }
                else if(t.pageX - this.x < -this.thrs){
                    this.callback("left")
                }
            }
            else if(this.dir=="ver" && this.y){
                if(t.pageY - this.y > this.thrs){
                    this.callback("down")
                }
                else if(t.pageY - this.y < -this.thrs){
                    this.callback("up")
                }
            }
        }
    }
}