import { Save } from "@/models/save";
import { ControlPointDir, ControlPointSta } from "@/models/save";

export const devSave:Save = {
    idIncre: 104,
    points: [
        {
            id: 1,
            pos: [200, 200],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta,
            name: '三阳路',
            nameS: 'sanyang Rd.',
            nameP: [0,20]
        },
        {
            id: 2,
            pos: [550, 300],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta
        },
        {
            id: 3,
            pos: [700, 550],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta
        },
        {
            id: 4,
            pos: [300, 800],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta
        },
        {
            id: 11,
            pos: [650, 700],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta
        },
        {
            id: 5,
            pos: [800, 200],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 6,
            pos: [200, 400],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 7,
            pos: [300, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [-15, 15]
        },
        {
            id: 8,
            pos: [450, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [0, 20]
        },
        {
            id: 9,
            pos: [600, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [0, -20]
        },
        {
            id: 10,
            pos: [750, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [15, -15]
        }
    ],
    lines: [
        {
            id: 101,
            pts: [1, 2, 3, 11, 4],
            name: "一号线",
            nameSub: "Line 1",
            color: "#44cef6"
        },
        {
            id: 102,
            pts: [5, 2, 6],
            name: "二号线",
            nameSub: "Line 2",
            color: "#009900"
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