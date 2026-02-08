import { Coord } from "@/models/coord"
import { coordDistSq } from "../coordUtils/coordDist"
import { eventClientCoord } from "./eventClientCoord"

let downCoord:Coord = [-1000, -1000]
let downTime:number
const moveThrs = 100
export type PureClickType = 'right'|'ctrlAndRight'
export function listenPureClick(ele:HTMLElement, callBack:((clientCord:Coord, clickType?:PureClickType)=>void)){
    ele.addEventListener('mousedown', e => downHandler(e))
    ele.addEventListener('mouseup', e => upHandler(e, callBack))
}
function downHandler(e:MouseEvent|TouchEvent){
    const pos = eventClientCoord(e)
    if(pos){
        downCoord = pos
        downTime = +new Date();
    }
}
function upHandler(e:MouseEvent|TouchEvent, callBack:((c:Coord, clickType?:PureClickType)=>void)){
    const upCoord = eventClientCoord(e)
    if(!upCoord)
        return;
    const distSq = coordDistSq(upCoord, downCoord)
    const now = +new Date()
    if(distSq <= moveThrs && (now - downTime) < 500){
        let clickType:PureClickType|undefined = undefined
        if(e instanceof MouseEvent){
            if(e.button === 2){
                clickType = 'right'
                if(e.ctrlKey || e.metaKey)
                    clickType = 'ctrlAndRight'
            }
        }

        callBack(upCoord, clickType)
    }
}
