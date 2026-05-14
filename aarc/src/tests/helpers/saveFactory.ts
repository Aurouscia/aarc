import { Line, Save, StyleSlice, TimeSlice, LineStyle, LineTimeInfo, ControlPoint, ControlPointDir, ControlPointSta } from '@/models/save'
import { configDefault } from '@/models/stores/configStore'

let idCounter = 1

export function resetIdCounter() {
  idCounter = 1
}

export function nextId(): number {
  return idCounter++
}

export function createPoint(id: number, name?: string): ControlPoint {
  return {
    id,
    pos: [id * 10, id * 10],
    dir: ControlPointDir.vertical,
    sta: ControlPointSta.sta,
    name
  }
}

export function createLine(pts: number[], overrides?: Partial<Line>): Line {
  return {
    id: nextId(),
    pts,
    name: '测试线路',
    nameSub: '',
    color: '#ff0000',
    type: 0 as const,
    ...overrides
  }
}

export function createStyleSlice(overrides: Partial<StyleSlice> & { line: number; fromPt: number; toPt: number; style: number }): StyleSlice {
  return {
    id: nextId(),
    ...overrides
  }
}

export function createTimeSlice(overrides: Partial<TimeSlice> & { line: number; fromPt: number; toPt: number; time: LineTimeInfo }): TimeSlice {
  return {
    id: nextId(),
    ...overrides
  }
}

export function createLineStyle(id: number, name?: string): LineStyle {
  return {
    id,
    name: name || `样式${id}`,
    layers: [{ color: '#000000' }]
  }
}

export function createEmptySave(overrides?: Partial<Save>): Save {
  return {
    idIncre: 1000,
    points: [],
    lines: [],
    textTags: [],
    cvsSize: [1000, 1000],
    config: configDefault,
    meta: {},
    ...overrides
  }
}
