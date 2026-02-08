import { useApiStore } from "@/app/com/apiStore";
import { useConfigStore } from "@/models/stores/configStore";
import { storeToRefs } from "pinia";
import { computed, ref, Ref } from "vue";

type TargetRef = Ref<string|undefined|null>
export const usePinyinConvert = (source:TargetRef, dest:TargetRef, afterDone:()=>void)=>{
    const api = useApiStore()
    const { config } = storeToRefs(useConfigStore())
    const overridingForSource = ref<string>()
    const overridingToDest = ref<string>()
    const overridingReady = computed<boolean>(()=>!!source.value && overridingForSource.value === source.value)
    const rules = computed<{[key:string]:string}>(()=>{
        const res:{[key:string]:string} = {}
        const str = config.value.pinyinConvert?.rules
        if(str){
            const lines = str.split('\n')
            for(const line of lines){
                const kv = line.split(/[:：]/, 2)
                if(kv.length === 2){
                    res[kv[0]] = kv[1]
                }
            }
        }
        return res
    })
    async function convertPinyin(){
        if(!source.value)
            return
        let res:string|undefined|null
        if(overridingReady.value && overridingToDest.value){
            //若现在已经是二次点击，则无需重新用http获取
            res = overridingToDest.value
        }
        else{
            const c = config.value.pinyinConvert
            res = await api.saveUtils.pinyinConvert({
                text: source.value,
                options:{
                    rules: rules.value,
                    spaceBetweenChars: c?.spaceBetweenChars,
                    caseType: c?.caseType,
                    variantType: c?.variantType
                }
            })
        }
        const apply = ()=>{
            overridingForSource.value = undefined
            overridingToDest.value = undefined
            dest.value = res
            afterDone()
        }
        if(res){
            if(dest.value){
                //目标Ref已经有值，判断是否覆盖
                if(res === dest.value){
                    return //目标Ref的值和结果一样：什么都不做
                }
                if(!overridingReady.value){
                    //“确认”值和源不同：把“确认”值设为源（要求二次点击）
                    overridingForSource.value = source.value
                    overridingToDest.value = res //记录结果，可避免重复获取
                }else{
                    //“确认”值和源相同：应用
                    apply()
                }
            }else{
                //目标Ref没值，应用
                apply()
            }
        }
    }
    return {
        convertPinyin,
        pinyinOverriding: overridingReady
    }
}