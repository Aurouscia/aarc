import { Coord } from "@/models/coord";
import { PosRel } from "./coordRel";

export function coordFill(a:Coord, b:Coord, xDiff:number, yDiff:number,
        posRel:PosRel, type:"top"|"bottom"|"midVert"|"midInc"):Coord[]
    {
        const fill = coordFillWhat(a,b,xDiff,yDiff,posRel,type);
        return [a,...fill,b]
    }
function coordFillWhat(a:Coord, b:Coord, xDiff:number, yDiff:number,
        posRel:PosRel, type:"top"|"bottom"|"midVert"|"midInc"):Coord[]
    {
    if(posRel=='l' || posRel=='u' || posRel=='lu' || posRel == 'ur'){
        return []
    }
    console.log({xDiff,yDiff})
    if(posRel=='llu'){
        if(type=='top'){
            const bias = - xDiff + yDiff
            return [[a[0]+bias, a[1]]]
        }else if(type=='bottom'){
            const bias = - xDiff + yDiff
            return [[b[0]-bias, b[1]]]
        }else if(type=='midInc'){
            const bias = (- xDiff + yDiff)/2
            return [[a[0]+bias, a[1]], [b[0]-bias, b[1]]]
        }else{
            const bias = -yDiff/2
            return [[a[0]+bias, a[1]+bias], [b[0]-bias, b[1]-bias]]
        }
    }else if(posRel=='luu'){
        if(type=='top'){
            const bias = xDiff - yDiff
            return [[b[0], b[1]-bias]]
        }else if(type=='bottom'){
            const bias = xDiff - yDiff
            return [[a[0], a[1]+bias]]
        }else if(type=='midInc'){
            const bias = (xDiff - yDiff)/2
            return [[a[0], a[1]+bias], [b[0], b[1]-bias]]
        }else{
            const bias = -xDiff/2
            return [[a[0]+bias, a[1]+bias], [b[0]-bias, b[1]-bias]]
        }
    }else if(posRel=='uur'){
        if(type=='top'){
            const bias = -xDiff - yDiff
            return [[b[0], b[1]-bias]]
        }else if(type=='bottom'){
            const bias = -xDiff - yDiff
            return [[a[0], a[1]+bias]]
        }else if(type=='midInc'){
            const bias = (-xDiff - yDiff)/2
            return [[a[0], a[1]+bias], [b[0], b[1]-bias]]
        }else{
            const bias = -xDiff/2
            return [[a[0]+bias, a[1]-bias], [b[0]-bias, b[1]+bias]]
        }
    }else if(posRel=='urr'){
        if(type=='top'){
            const bias = xDiff + yDiff
            return [[a[0]-bias, a[1]]]
        }else if(type=='bottom'){
            const bias = xDiff + yDiff
            return [[b[0]+bias, b[1]]]
        }else if(type=='midInc'){
            const bias = (xDiff + yDiff)/2
            return [[a[0]-bias, a[1]], [b[0]+bias, b[1]]]
        }else{
            const bias = yDiff/2
            return [[a[0]+bias, a[1]-bias], [b[0]-bias, b[1]+bias]]
        }
    }
    return []
}