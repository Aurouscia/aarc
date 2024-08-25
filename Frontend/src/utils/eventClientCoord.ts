import { Coord } from "@/models/coord";

export function eventClientCoord(e:MouseEvent|TouchEvent):Coord|undefined{
    let x:number,y:number;
    if('touches' in e){
        if(e.touches.length == 1){
            x = e.touches[0].clientX
            y = e.touches[0].clientY
        }else{
            return;
        }
    }else{
        x = e.clientX,
        y = e.clientY
    }
    return [x, y]
}