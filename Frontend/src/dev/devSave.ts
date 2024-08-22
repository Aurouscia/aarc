import { Save } from "@/models/save";
import { ControlPointDir, ControlPointSta } from "@/models/save";

export const devSave:Save = {
    idIncre: 5,
    points: [
        {
            id: 1,
            pos: [0, 0],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain
        }
    ],
    lines: [
        {
            id: 2,
            pts: [1],
            name: "一号线",
            nameSub: "Line 1",
            color: "#ff0000"
        },
        {
            id: 3,
            pts: [],
            name: "二号线",
            nameSub: "Line 2",
            color: "#00ff00"
        },
        {
            id: 4,
            pts: [],
            name: "三号线",
            nameSub: "Line 3",
            color: "#0000ff"
        }
    ]
}