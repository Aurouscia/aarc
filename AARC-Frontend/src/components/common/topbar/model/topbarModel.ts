import { RouteLocationRaw } from "vue-router"

export interface TopbarModel {
    Items: TopbarModelItem[]
}

export interface TopbarModelItem{
    Title: string
    Link?: RouteLocationRaw
    IsActive?: boolean
    SubItems?: TopbarModelSubItem[]
}

export interface TopbarModelSubItem{
    Title: string
    Link: RouteLocationRaw
}