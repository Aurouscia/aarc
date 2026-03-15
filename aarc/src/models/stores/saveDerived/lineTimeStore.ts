import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "../saveStore";
import { computed } from "vue";
import { Line, LineTimeInfo } from "@/models/save";
import { keepOrderSort } from "@/utils/lang/keepOrderSort";

/** 时间点类型 */
export type TimePointType = 
    | 'propose'      // 规划
    | 'construct'    // 开工
    | 'open'         // 开通
    | 'suspendStart' // 暂停开始
    | 'suspendEnd'   // 暂停结束
    | 'abandon'      // 废弃

/** 单个时间点 */
export interface TimePoint {
    /** 时间戳（年份或具体日期转为数字，如 2015 或 20150315） */
    value: number
    /** 时间点类型 */
    type: TimePointType
    /** 关联的线路ID */
    lineId: number
    /** 关联的线路名称 */
    lineName: string
}

/** 筛选参数 */
export interface TimePointFilter {
    /** 只包含指定类型的时间点 */
    types?: TimePointType[]
    /** 只包含指定线路ID的时间点 */
    lineIds?: number[]
    /** 最小时间（包含） */
    minTime?: number
    /** 最大时间（包含） */
    maxTime?: number
    /** 排除已废弃线路的时间点（默认 false） */
    excludeAbandoned?: boolean
    /** 只包含有 open 时间的线路（即真实存在过的线路，默认 false） */
    onlyOpened?: boolean
}

/** 时间范围 */
export interface TimeRange {
    min: number
    max: number
}

export const useLineTimeStore = defineStore('lineTime', () => {
    const { save } = storeToRefs(useSaveStore())

    /**
     * 从 LineTimeInfo 中提取所有时间点
     */
    function extractTimePointsFromLine(line: Line): TimePoint[] {
        const points: TimePoint[] = []
        const time = line.time
        if (!time) {
            return points
        }

        // propose - 规划
        if (typeof time.propose === 'number') {
            points.push({
                value: time.propose,
                type: 'propose',
                lineId: line.id,
                lineName: line.name
            })
        }

        // construct - 开工
        if (typeof time.construct === 'number') {
            points.push({
                value: time.construct,
                type: 'construct',
                lineId: line.id,
                lineName: line.name
            })
        }

        // open - 开通
        if (typeof time.open === 'number') {
            points.push({
                value: time.open,
                type: 'open',
                lineId: line.id,
                lineName: line.name
            })
        }

        // suspend - 暂停区间
        if (time.suspend && time.suspend.length > 0) {
            for (const [start, end] of time.suspend) {
                if (typeof start === 'number') {
                    points.push({
                        value: start,
                        type: 'suspendStart',
                        lineId: line.id,
                        lineName: line.name
                    })
                }
                if (typeof end === 'number') {
                    points.push({
                        value: end,
                        type: 'suspendEnd',
                        lineId: line.id,
                        lineName: line.name
                    })
                }
            }
        }

        // abandon - 废弃
        if (typeof time.abandon === 'number') {
            points.push({
                value: time.abandon,
                type: 'abandon',
                lineId: line.id,
                lineName: line.name
            })
        }

        return points
    }

    /**
     * 获取所有原始时间点（未筛选、未排序）
     */
    const allTimePoints = computed<TimePoint[]>(() => {
        const lines = save.value?.lines
        if (!lines || lines.length === 0) {
            return []
        }

        const points: TimePoint[] = []
        for (const line of lines) {
            points.push(...extractTimePointsFromLine(line))
        }
        return points
    })

    /**
     * 筛选时间点
     */
    function filterTimePoints(points: TimePoint[], filter?: TimePointFilter): TimePoint[] {
        if (!filter) {
            return points
        }

        return points.filter(p => {
            // 按类型筛选
            if (filter.types && filter.types.length > 0) {
                if (!filter.types.includes(p.type)) {
                    return false
                }
            }

            // 按线路ID筛选
            if (filter.lineIds && filter.lineIds.length > 0) {
                if (!filter.lineIds.includes(p.lineId)) {
                    return false
                }
            }

            // 按最小时间筛选
            if (typeof filter.minTime === 'number' && p.value < filter.minTime) {
                return false
            }

            // 按最大时间筛选
            if (typeof filter.maxTime === 'number' && p.value > filter.maxTime) {
                return false
            }

            return true
        })
    }

    /**
     * 获取线路的 time 信息（用于筛选）
     */
    function getLineTimeInfo(lineId: number): LineTimeInfo | undefined {
        const line = save.value?.lines.find(l => l.id === lineId)
        return line?.time
    }

    /**
     * 检查线路是否满足 "onlyOpened" 或 "excludeAbandoned" 条件
     */
    function checkLineFilter(lineId: number, filter?: TimePointFilter): boolean {
        if (!filter) {
            return true
        }

        const timeInfo = getLineTimeInfo(lineId)

        // 只包含有 open 时间的线路
        if (filter.onlyOpened && typeof timeInfo?.open !== 'number') {
            return false
        }

        // 排除已废弃线路
        if (filter.excludeAbandoned && typeof timeInfo?.abandon === 'number') {
            return false
        }

        return true
    }

    /**
     * 获取所有时间点（支持筛选）
     * @param filter 筛选参数
     * @param sort 是否按时间排序（默认 true）
     */
    function getTimePoints(filter?: TimePointFilter, sort: boolean = true): TimePoint[] {
        // 先按线路筛选（处理 onlyOpened 和 excludeAbandoned）
        let lineIds: number[] | undefined = filter?.lineIds
        
        if (filter?.onlyOpened || filter?.excludeAbandoned) {
            const allLines = save.value?.lines || []
            const filteredLineIds = allLines
                .filter(l => checkLineFilter(l.id, filter))
                .map(l => l.id)
            
            // 如果同时指定了 lineIds，取交集
            if (lineIds && lineIds.length > 0) {
                lineIds = lineIds.filter(id => filteredLineIds.includes(id))
            } else {
                lineIds = filteredLineIds
            }
        }

        // 提取并筛选时间点
        let points = allTimePoints.value
        points = filterTimePoints(points, {
            ...filter,
            lineIds
        })

        // 排序
        if (sort) {
            points = points.sort((a, b) => a.value - b.value)
        }

        return points
    }

    /**
     * 获取去重后的时间点值列表
     * @param filter 筛选参数
     * @param sort 是否排序（默认 true）
     */
    function getUniqueTimeValues(filter?: TimePointFilter, sort: boolean = true): number[] {
        const points = getTimePoints(filter, sort)
        const uniqueValues = [...new Set(points.map(p => p.value))]
        return sort ? uniqueValues.sort((a, b) => a - b) : uniqueValues
    }

    /**
     * 获取时间范围
     * @param filter 筛选参数
     */
    function getTimeRange(filter?: TimePointFilter): TimeRange | null {
        const values = getUniqueTimeValues(filter, false)
        if (values.length === 0) {
            return null
        }
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        }
    }

    /**
     * 获取指定时间点的所有事件
     * @param timeValue 时间点值
     * @param filter 额外筛选参数
     */
    function getEventsAtTime(timeValue: number, filter?: Omit<TimePointFilter, 'minTime' | 'maxTime'>): TimePoint[] {
        return getTimePoints({
            ...filter,
            minTime: timeValue,
            maxTime: timeValue
        })
    }

    /**
     * 获取线路的所有时间点
     * @param lineId 线路ID
     */
    function getTimePointsByLine(lineId: number): TimePoint[] {
        const line = save.value?.lines.find(l => l.id === lineId)
        if (!line) {
            return []
        }
        return extractTimePointsFromLine(line)
    }

    /**
     * 获取所有包含时间信息的线路
     */
    const linesWithTime = computed<Line[]>(() => {
        return save.value?.lines.filter(l => l.time != null) || []
    })

    /**
     * 获取按开通时间排序的线路数组（无开通时间的排最前，时间相同的保持原顺序）
     */
    const linesSortedByOpenTime = computed<Line[]>(() => {
        const lines = save.value?.lines || []
        const linesCopy = [...lines]
        keepOrderSort(linesCopy, (a, b) => {
            const aOpen = a.time?.open
            const bOpen = b.time?.open
            // 无开通时间的排最前
            if (typeof aOpen !== 'number' && typeof bOpen !== 'number') {
                return 0
            }
            if (typeof aOpen !== 'number') {
                return -1
            }
            if (typeof bOpen !== 'number') {
                return 1
            }
            return aOpen - bOpen
        })
        return linesCopy
    })

    /**
     * 获取按开通时间倒序的线路数组（无开通时间的排最后，时间相同的保持原顺序）
     */
    const linesSortedByOpenTimeDesc = computed<Line[]>(() => {
        return [...linesSortedByOpenTime.value].reverse()
    })

    return {
        allTimePoints,
        linesWithTime,
        linesSortedByOpenTime,
        linesSortedByOpenTimeDesc,
        getTimePoints,
        getUniqueTimeValues,
        getTimeRange,
        getEventsAtTime,
        getTimePointsByLine,
        extractTimePointsFromLine
    }
})
