import { ColorPreset, ControlPointLinkType, LineType, Save } from "@/models/save";
import { ControlPointDir, ControlPointSta } from "@/models/save";

//开发/展示用存档数据
export const devSave:Save = {
    cvsSize: [2000, 2000],
    idIncre: 10000000,
    points: [
        {
            id: 1,
            pos: [350, 250],
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
            pos: [500, 750],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '体育中心',
            nameS: 'Sports Center',
            nameP: [0, 20]
        },
        {
            id: 5,
            pos: [700, 250],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '至喜',
            nameS: 'ZhiXi',
            nameP: [0, 20]
        },
        {
            id: 6,
            pos: [400, 400],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '明启',
            nameS: 'MingQi',
            nameP: [0, 20]
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
            id: 10,
            pos: [275, 500],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
        },
        {
            id: 11,
            pos: [650, 700],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta,
            name: '暖冬',
            nameS: 'NuanDong',
            nameP: [20, 0]
        },
        {
            id: 12,
            pos: [350, 700],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta,
            name: '钢铁厂',
            nameS: 'GangTieChang',
            nameP: [-12.727922058, 12.727922058]
        },
        {
            id: 13,
            pos: [650, 650],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.sta,
            name: '暖冬北',
            nameS: 'N. NuanDong',
            nameP: [20, 0]
        },
        {
            id: 33,
            pos: [750, 900],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '火车北站\n西广场(假日酒店)',
            nameS: 'Northern Railway Station\nSouth Square (Holiday Inn)',
            nameP: [0, 20]
        },
        {
            id: 34,
            pos: [1050, 900],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta,
            name: '东南新城',
            nameS: 'S.E. New Town',
            nameP: [0, 20]
        },
        {
            id: 50,
            pos: [200, 900],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 51,
            pos: [650, 800],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain
        },
        {
            id: 52,
            pos: [1000, 700],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 53,
            pos: [950, 550],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain,
        },
        {
            id: 54,
            pos: [950, 450],
            dir: ControlPointDir.incline,
            sta: ControlPointSta.plain
        },
        {
            id: 55,
            pos: [1200, 400],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 56,
            pos: [1200, 850],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.plain
        },
        {
            id: 57,
            pos: [1000, 850],
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta
        }
    ],
    lines: [
        {
            id: 150,
            pts: [50, 51, 52],
            name: '向阳江',
            nameSub: 'XiangYang Rr.',
            color: '#000000',
            colorPre: ColorPreset.water,
            type: LineType.terrain,
            width: 3
        },
        {
            id: 151,
            pts: [52, 53, 54, 55, 56, 57, 52],
            name: '丽景湖',
            nameSub: 'LiJing Lake',
            color: '#000000',
            colorPre: ColorPreset.water,
            type: LineType.terrain,
            isFilled: true
        },
        {
            id: 101,
            pts: [10, 1, 2, 3, 13, 4, 12, 10],
            name: "1号线",
            nameSub: "Line 1",
            color: "#44cef6",
            type: LineType.common
        },
        {
            id: 102,
            pts: [5, 2, 6, 9],
            name: "2号线",
            nameSub: "Line 2",
            color: "#009900",
            type: LineType.common
        },
        {
            id: 103,
            pts: [7, 8, 11, 33],
            name: "开发区线",
            nameSub: "DevZone Line",
            color: "#ff8800",
            type: LineType.common,
            style: 100000
        },
        {
            id: 104,
            pts: [11, 34],
            name: "新城支线",
            nameSub: "New Town Branch",
            color: "#ff8800",
            type: LineType.common,
            parent: 103
        }
    ],
    textTags:[
        {
            id: 1000,
            forId: 101,
            pos: [100,100]
        },
        {
            id: 1001,
            forId: 102,
            pos: [100,200]
        },
        {
            id: 1002,
            forId: 103,
            pos: [100,300],
            width: 180
        },
        {
            id: 1003,
            forId: 151,
            pos: [1100, 600]
        },
        {
            id: 1004,
            pos: [1100, 150],
            text: "某市轨道交通路线图",
            textS: "some city subway route map",
            textOp: {size:2, color:'#008FFA'},
            textSOp: {size:2, color:'#999999'}
        },
        {
            id: 1005,
            pos: [900, 350],
            text: "噜噜噗噗机场",
            textS: "Lulupupu Airport",
            icon:1000000
        }
    ],
    pointLinks:[
        {
            pts: [3, 8],
            type: ControlPointLinkType.dot
        },
        {
            pts: [11, 13],
            type: ControlPointLinkType.fat,
        }
    ],
    lineGroups:[
        {
            id: 10000,
            name:"远郊线路",
            lineType: LineType.common,
        }
    ],
    lineStyles:[
        {
            id: 100000,
            name:"快线",
            layers:[
                {
                    width: 0.2,
                    color: '#ffffff',
                    colorMode: 'fixed',
                    opacity: 1
                }
            ]
        }
    ],
    textTagIcons:[
        {
            id: 1000000,
            name: '机场',
            url: '/icons/airport.png',
            width: 50
        }
    ],
    config:{}
}