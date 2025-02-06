import { ControlPoint, ControlPointSta } from "@/models/save";
import { coordDistSq, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { useConfigStore } from "../configStore";
import { numberCmpEpsilon } from "@/utils/consts";
import { removeAllByPred } from "@/utils/lang/indicesInArray";

export const useStaClusterStore = defineStore('staCluster', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    saveStore.deletedPoint = cleanClustersFromDeletedPt
    
    const configClingingDist = cs.config.snapOctaClingPtPtDist
    const skipClingingCheckThrs = 2.5*configClingingDist

    let staClusters:ControlPoint[][]|undefined = undefined
    let belong: Record<number, ControlPoint[] | undefined> = {}
    function setStaClusters(clusters:ControlPoint[][]){
        staClusters = clusters
    }
    function getStaClusters(){
        if(!staClusters)
            initClusters()
        return staClusters
    }

    /**
     * 同样朝向且紧挨着的控制点，会被汇总为一个“晶体”（将会被用一个矩形覆盖）
     * 所有点两两互相检查，非常费时，只能初始化用
     * 运行完后staClusters和belong都被完整设置好
     */
    function initClusters(): ControlPoint[][] | undefined {
        const pts = saveStore.save?.points.filter(pt => pt.sta == ControlPointSta.sta)
        if (!pts)
            return;
        staClusters = []
        belong = {}
        for (let i = 0; i < pts.length - 1; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const a = pts[i]
                const b = pts[j]
                if(Math.abs(a.pos[0] - b.pos[0]) > skipClingingCheckThrs)
                    continue
                if(Math.abs(a.pos[1] - b.pos[1]) > skipClingingCheckThrs)
                    continue
                tryMergeTwoPoints(a, b)
            }
        }
        cleanClusters()
    }
    function updateCrystalsBecauseOf(pt:ControlPoint){
        const pts = saveStore.save?.points.filter(pt => pt.sta === ControlPointSta.sta)
        if(!pts || !staClusters)
            return
        const pBelong = belong[pt.id] //pt曾经属于的组团
        let pBelongIds:number[] = [pt.id]
        if(pBelong){
            pBelongIds = pBelong.map(x=>x.id)//取出曾经组团包含的点id（包括pt自己）
            pBelongIds.forEach(x=>{
                belong[x] = undefined
            }) //全部退出组团
            const pBelongClusterIdx = staClusters.indexOf(pBelong)
            staClusters.splice(pBelongClusterIdx, 1) //删除该组团

            for (let i = 0; i < pBelong.length - 1; i++) {
                for (let j = i + 1; j < pBelong.length; j++) {
                    const a = pBelong[i]
                    const b = pBelong[j]
                    tryMergeTwoPoints(a, b) //原组团成员互相重新检测
                }
            }
        }
        for (let i = 0; i < pts.length; i++) {
            const b = pts[i]
            if(pBelongIds.includes(b.id))
                continue
            tryMergeTwoPoints(pt, b) //检测pt到原组团外其他所有点
        }
        cleanClusters()
    }
    function tryMergeTwoPoints(a:ControlPoint, b:ControlPoint){
        if(a===b || a.sta !== ControlPointSta.sta || b.sta !== ControlPointSta.sta)
            return
        if (ptClinging(a, b)) {
            const aBelong = belong[a.id]
            const bBelong = belong[b.id]
            if (aBelong && bBelong) {
                if(aBelong === bBelong) //四个点2x2排列时会发生
                    return
                for (const pt of bBelong) {
                    aBelong.push(pt)
                    belong[pt.id] = aBelong
                }
            } else if (aBelong) {
                aBelong.push(b)
                belong[b.id] = aBelong
            } else if (bBelong) {
                bBelong.push(a)
                belong[a.id] = bBelong
            } else {
                const newCrys = [a, b]
                belong[a.id] = newCrys;
                belong[b.id] = newCrys;
                staClusters?.push(newCrys)
            }
        }
    }
    function cleanClusters(){
        if(staClusters)
            removeAllByPred<ControlPoint[]>(staClusters, x => x.length<=1)
        for(const ptId of Object.keys(belong)){
            const ptIdNum = parseInt(ptId)
            if(belong[ptIdNum] && !belong[ptIdNum].some(x=>x.id === ptIdNum))
                belong[ptIdNum] = undefined
        }
        for(const c of staClusters||[]){
            removeAllByPred(c, (pt)=>{
                const ptBelong = belong[pt.id]
                return !ptBelong || ptBelong !== c
            })
        }
    }
    function cleanClustersFromDeletedPt(ptId:number){
        const pBelong = belong[ptId]
        if(pBelong){
            removeAllByPred(pBelong, x=>x.id===ptId)
            belong[ptId] = undefined
            if(pBelong.length > 1){
                updateCrystalsBecauseOf(pBelong[0])
            }else{
                cleanClusters()
            }
        }
    }

    function ptClinging(a:ControlPoint, b:ControlPoint):boolean{
        if(a.dir !== b.dir){
            return false
        }
        const sizeA = saveStore.getLinesDecidedPtSize(a.id)
        const sizeB = saveStore.getLinesDecidedPtSize(b.id)
        const distMut = (sizeA + sizeB)/2
        const clingingDist = configClingingDist * distMut
        const clingingDistSqrBiggerByEpsilon = clingingDist**2 + numberCmpEpsilon
        return !!coordDistSqLessThan(a.pos, b.pos, clingingDistSqrBiggerByEpsilon)
    }

    function tryTransferStaNameWithinCluster(sta:ControlPoint){
        if(!sta.nameP)
            return
        const cluster = getStaClusters()?.find(c=>c.find(s=>s.id === sta.id))
        if(!cluster)
            return
        const nameGlobalPos = coordAdd(sta.pos, sta.nameP)
        let originalDistSq = coordDistSq(sta.pos, nameGlobalPos)
        const transferThrs = 200
        let minDistSq = 1e10
        let closestPt:ControlPoint|undefined;
        cluster.forEach(pt=>{
            if(pt.id == sta.id)
                return
            const distSq = coordDistSq(pt.pos, nameGlobalPos)
            if(distSq < minDistSq){
                minDistSq = distSq;
                closestPt = pt;
            }
        })
        if(closestPt && originalDistSq - minDistSq > transferThrs){
            const relPosToClosest = coordSub(nameGlobalPos, closestPt.pos)
            closestPt.name = sta.name
            closestPt.nameS = sta.nameS
            closestPt.nameP = relPosToClosest
            return closestPt
        }
    }
    function getMaxSizePtWithinCluster(ptId:number, sizeType:'ptSize'|'ptNameSize'){
        const get = sizeType === 'ptSize' 
            ? (id:number)=>saveStore.getLinesDecidedPtSize(id)
            : (id:number)=>saveStore.getLinesDecidedPtNameSize(id)
        const cluster = belong[ptId]
        if(!cluster)
            return get(ptId)
        const sizes = cluster.map(x=>get(x.id))
        if(sizes.length===0)
            return 1
        return Math.max(...sizes)
    }

    function clearItems(){
        staClusters = undefined
        belong = {}
    }

    return {
        setStaClusters,
        getStaClusters,
        updateCrystalsBecauseOf,
        tryTransferStaNameWithinCluster,
        getMaxSizePtWithinCluster,
        clearItems
    }
})