import { Coord } from "@/models/coord";
import { CvsContext } from "@/models/cvs/common/cvsContext";
import { sqrt2half } from "../consts";

interface DrawCrossParams{
    pos:Coord,
    /** 快捷方向：vertical=0°（+形），incline=45°（×形）。angleDeg 存在时忽略本项 */
    dir?:'vertical'|'incline'
    /** 任意旋转角度（度，canvas 坐标系中顺时针为正） */
    angleDeg?:number
    /** 空心十字：中心向外留空该距离，四条臂仅绘制外侧部分（此时画四笔而非两笔）。默认 0（贯通的两笔） */
    hollowGap?:number
    /** 每条臂绘制的长度，默认画到臂端（armLength - hollowGap） */
    drawLength?:number
    /** 臂的实际长度（端点到中心的距离） */
    armLength:number
    repetitions:{
        armWidth:number
        color: string
    }[]
}
export function drawCross(ctx:CvsContext, params:DrawCrossParams){
    const {pos, dir, angleDeg, armLength, repetitions} = params
    //两条互相垂直的臂的单位方向向量
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
    const start = params.hollowGap ?? 0
    const end = start + (params.drawLength ?? (armLength - start))
    //四条臂（方向，起点距离，终点距离）；非空心时两条贯通的线即可
    const strokes:{from:Coord, to:Coord}[] = []
    if(start > 0){
        for(const d of [armA, armB]){
            for(const s of [1, -1]){
                strokes.push({
                    from: [pos[0]+d[0]*start*s, pos[1]+d[1]*start*s],
                    to: [pos[0]+d[0]*end*s, pos[1]+d[1]*end*s]
                })
            }
        }
    }else{
        strokes.push(
            {from: [pos[0]-armA[0]*end, pos[1]-armA[1]*end], to: [pos[0]+armA[0]*end, pos[1]+armA[1]*end]},
            {from: [pos[0]-armB[0]*end, pos[1]-armB[1]*end], to: [pos[0]+armB[0]*end, pos[1]+armB[1]*end]}
        )
    }
    ctx.lineCap = 'round'
    repetitions.forEach(r=>{
        ctx.beginPath()
        strokes.forEach(s=>{
            ctx.moveTo(...s.from)
            ctx.lineTo(...s.to)
        })
        ctx.lineWidth = r.armWidth;
        ctx.strokeStyle = r.color
        ctx.stroke()
    })
}
