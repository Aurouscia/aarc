export interface SaveDto{
    Id:number
    Name:string
    Version?:string
    OwnerUserId?:number
    OwnerName?:string
    Intro?:string
    StaCount?:number
    LineCount?:number
    Priority?:number
    LastActive?:string
}