import { Coord } from "@/models/coord"
import { coordDistSq } from "../coordUtils/coordDist"
import { eventClientCoord } from "./eventClientCoord"

let downCoord:Coord = [-1000, -1000]
let downTime:number
const moveThrs = 100
export function listenPureClick(ele:HTMLElement, callBack:((clientCord:Coord, isRight?:boolean)=>void)){
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
function upHandler(e:MouseEvent|TouchEvent, callBack:((c:Coord, isRight?:boolean)=>void)){
    const upCoord = eventClientCoord(e)
    if(!upCoord)
        return;
    const distSq = coordDistSq(upCoord, downCoord)
    const now = +new Date()
    if(distSq <= moveThrs && (now - downTime) < 500){
        let isRightBtn = false
        if('button' in e){
            isRightBtn = e.button === 2
        }
        callBack(upCoord, isRightBtn)
    }
}
