import { Coord } from "@/models/coord";
import { CvsContext } from "@/models/cvs/common/cvsContext";
import { sqrt2half } from "../consts";

interface DrawCrossParams{
    pos:Coord,
    /** 快捷方向：vertical=0°（+形），incline=45°（×形）。angleDeg 存在时忽略本项 */
    dir?:'vertical'|'incline'
    /** 任意旋转角度（度，canvas 坐标系中顺时针为正） */
    angleDeg?:number
    /** 臂的实际长度（端点到中心的距离） */
    armLength:number
    repetitions:{
        armWidth:number
        color: string
    }[]
}
export function drawCross(ctx:CvsContext, params:DrawCrossParams){
    const {pos, dir, angleDeg, armLength, repetitions} = params
    //两条互相垂直的臂的方向向量（臂长为 armLength 的倍数）
    let armA:Coord, armB:Coord
    if(angleDeg !== undefined){
        const rad = angleDeg * Math.PI / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        armA = [cos, sin]
        armB = [-sin, cos]
    }else if(dir === 'incline'){
        //等价于 angleDeg=45：臂实际长度也为 armLength
        armA = [sqrt2half, sqrt2half]
        armB = [-sqrt2half, sqrt2half]
    }else{
        armA = [1, 0]
        armB = [0, 1]
    }
    const a1:Coord = [pos[0]-armA[0]*armLength, pos[1]-armA[1]*armLength]
    const a2:Coord = [pos[0]+armA[0]*armLength, pos[1]+armA[1]*armLength]
    const b1:Coord = [pos[0]-armB[0]*armLength, pos[1]-armB[1]*armLength]
    const b2:Coord = [pos[0]+armB[0]*armLength, pos[1]+armB[1]*armLength]
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
