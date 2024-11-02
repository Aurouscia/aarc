import { ControlPoint } from "@/models/save";
import { coordDistSq } from "@/utils/coordUtils/coordDist";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { defineStore } from "pinia";

export const useStaClusterStore = defineStore('staCluster', ()=>{
    let staClusters:ControlPoint[][] = []
    function setStaClusters(clusters:ControlPoint[][]){
        staClusters = clusters
    }
    function tryTransferStaNameWithinCluster(sta:ControlPoint){
        if(!sta.nameP)
            return
        const cluster = staClusters.find(c=>c.find(s=>s.id === sta.id))
        if(!cluster)
            return
        const nameGlobalPos = coordAdd(sta.pos, sta.nameP)
        let minDistSq = 1e10
        let closestPt:ControlPoint|undefined;
        cluster.forEach(pt=>{
            const distSq = coordDistSq(pt.pos, nameGlobalPos)
            if(distSq < minDistSq){
                minDistSq = distSq;
                closestPt = pt;
            }
        })
        if(closestPt && closestPt.id !== sta.id){
            const relPosToClosest = coordSub(nameGlobalPos, closestPt.pos)
            closestPt.name = sta.name
            closestPt.nameS = sta.nameS
            closestPt.nameP = relPosToClosest
            return closestPt
        }
    }
    return { setStaClusters, tryTransferStaNameWithinCluster }
})