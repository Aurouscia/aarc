import { Save } from "@/models/save";
import { ControlPointDir, ControlPointSta } from "@/models/save";

export const devSave:Save = {
    idIncre: 104,
    points: [
        {
            id: 1,
            pos: [200, 200],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain
        },
        {
            id: 2,
            pos: [550, 300],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain
        },
        {
            id: 3,
            pos: [700, 700],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
    ],
    lines: [
        {
            id: 101,
            pts: [1, 2, 3],
            name: "一号线",
            nameSub: "Line 1",
            color: "#ff0000"
        },
        {
            id: 102,
            pts: [],
            name: "二号线",
            nameSub: "Line 2",
            color: "#00ff00"
        },
        {
            id: 103,
            pts: [],
            name: "三号线",
            nameSub: "Line 3",
            color: "#0000ff"
        }
    ]
}