import { timestampMS } from "./timestamp"

export function useTimeSpanClock(initialEnabled:boolean){
    let enabled = initialEnabled
    let ts = 0
    function timeSpanClock(msg?:string, end?:boolean){
        if(!enabled)
            return
        const now = timestampMS()
        if(ts>0){
            const span = now - ts
            console.log(`[${span}ms]${msg}`)
        }
        if(end)
            ts = 0
        else
            ts = now
    }
    function timeSpanClockEnd(msg?:string){
        timeSpanClock(msg, true)
    }
    function toggleTimeSpanClock(force:boolean){
        enabled = force
    }
    return { 
        timeSpanClock,
        timeSpanClockEnd,
        tic: timeSpanClock,
        toc: timeSpanClockEnd,
        toggleTimeSpanClock
    }
}