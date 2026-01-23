import { Save } from "@/models/save"

export function ensureValidIdIncre(save:Partial<Save>){
    const idIncre = save.idIncre ?? 0
    const shouldBe = recaculateIdIncre(save)
    if(shouldBe > idIncre){
        console.warn('[规范化]已修复idIncre异常值为'+shouldBe)
        save.idIncre = shouldBe
    }
}

function recaculateIdIncre(save:object){
    let maxId = 0
    for(const k of Object.values(save)){
        if(k instanceof Array){
            for(const i of k){
                if(typeof i['id'] === 'number'){
                    if(i['id'] > maxId){
                        maxId = i['id']
                    }
                }
            }
        }
    }
    return maxId + 1
}