import { Coord, SgnCoord } from "@/models/coord";
import { applyBias } from "../coordUtils/coordBias";
import { CvsContext } from "@/models/cvs/common/cvsContext";

interface DrawCrossParams{
    pos:Coord,
    dir:'vertical'|'incline'
    armLength:number
    repetitions:{
        armWidth:number
        color: string
    }[]
}
export function drawCross(ctx:CvsContext, params:DrawCrossParams){
    let biasA1:SgnCoord, biasA2:SgnCoord, biasB1:SgnCoord, biasB2:SgnCoord;
    const {pos, dir, armLength, repetitions} = params
    if(dir === 'incline'){
        biasA1 = [-1, -1]
        biasA2 = [1, 1]
        biasB1 = [-1, 1]
        biasB2 = [1, -1]
    }else{
        biasA1 = [-1, 0]
        biasA2 = [1, 0]
        biasB1 = [0, -1]
        biasB2 = [0, 1]
    }
    let markSize = armLength;
    const a1 = applyBias(pos, biasA1, markSize)
    const a2 = applyBias(pos, biasA2, markSize)
    const b1 = applyBias(pos, biasB1, markSize)
    const b2 = applyBias(pos, biasB2, markSize)
    ctx.lineCap = 'round'
    repetitions.forEach(r=>{
        ctx.beginPath()
        ctx.moveTo(...a1)
        ctx.lineTo(...a2)
        ctx.moveTo(...b1)
        ctx.lineTo(...b2)
        ctx.lineWidth = r.armWidth;
        ctx.strokeStyle = r.color
        ctx.stroke()
    })
}