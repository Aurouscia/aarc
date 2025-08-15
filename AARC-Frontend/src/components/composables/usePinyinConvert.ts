import { useApiStore } from "@/app/com/apiStore";
import { computed, ref, Ref } from "vue";

type TargetRef = Ref<string|undefined|null>
export const usePinyinConvert = (source:TargetRef, dest:TargetRef, afterDone:()=>void)=>{
    const api = useApiStore()
    const overridingForSource = ref<string>()
    const overridingReady = computed<boolean>(()=>overridingForSource.value === source.value)
    async function convertPinyin(){
        if(!source.value)
            return
        const res = await api.saveUtils.pinyinConvert({
            text: source.value
        })
        if(res){
            if(dest.value){
                //目标Ref已经有值，判断是否覆盖
                if(res === dest.value){
                    return //目标Ref的值和结果一样：什么都不做
                }
                if(!overridingReady.value){
                    //“确认”值和源不同：把“确认”值设为源（要求二次点击）
                    overridingForSource.value = source.value
                }else{
                    //“确认”值和源相同：应用
                    overridingForSource.value = undefined
                    dest.value = res
                    afterDone()
                }
            }else{
                //目标Ref没值，应用
                overridingForSource.value = undefined
                dest.value = res
                afterDone()
            }
        }
    }
    return {
        convertPinyin,
        pinyinOverriding: overridingReady
    }
}