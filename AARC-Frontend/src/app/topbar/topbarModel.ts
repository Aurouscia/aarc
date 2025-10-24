import { RouteLocationRaw } from "vue-router"

export interface TopbarModel {
    items: TopbarModelItem[]
}

export interface TopbarModelItem {
    title: string,
    link?: RouteLocationRaw,
    children?: TopbarModelItem[]
    childrenShow?: boolean
    beforeJump?: ()=>void
}