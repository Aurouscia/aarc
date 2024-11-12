import { Save } from "@/models/save";
import { ControlPointDir, ControlPointSta } from "@/models/save";

export const devSave:Save = {
    cvsSize: [2000, 2000],
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
            sta: ControlPointSta.sta,
            name: '五福路',
            nameS: 'wufu Rd.',
            nameP: [30,0]
        },
        {
            id: 3,
            pos: [700, 550],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '丽水阁',
            nameS: 'LiShuiGe',
            nameP: [20, 0] 
        },
        {
            id: 4,
            pos: [450, 750],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '体育中心',
            nameS: 'Sports Center',
            nameP: [0, 20]
        },
        {
            id: 11,
            pos: [650, 700],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta,
            name: '暖冬',
            nameS: 'NuanDong',
            nameP: [30, 0]
        },
        {
            id: 5,
            pos: [800, 200],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '至喜',
            nameS: 'ZhiXi',
            nameP: [0, 20]
        },
        {
            id: 6,
            pos: [350, 400],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '明启',
            nameS: 'MingQi',
            nameP: [0, -20]
        },
        {
            id: 7,
            pos: [532.322330475, 317.677669525],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta
        },
        {
            id: 8,
            pos: [600, 500],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: "中央公园",
            nameS: "Central Park",
            nameP: [-20, 0]
        },
        {
            id: 9,
            pos: [300, 500],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: "长治",
            nameS: "Chang Zhi",
            nameP: [0, 20]
        },
        {
            id: 30,
            pos: [300, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [-15, 15]
        },
        {
            id: 31,
            pos: [450, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [0, 20]
        },
        {
            id: 32,
            pos: [600, 1100],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [0, -20]
        },
        {
            id: 33,
            pos: [750, 900],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [20, 0]
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
            pts: [5, 2, 6, 9],
            name: "二号线",
            nameSub: "Line 2",
            color: "#009900"
        },
        {
            id: 103,
            pts: [7, 8, 11, 33],
            name: "三号线",
            nameSub: "Line 3",
            color: "#ff8800"
        }
    ],
    config:{}
}