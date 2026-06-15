<script setup lang="ts">
import { computed, CSSProperties, nextTick, ref } from 'vue';
import { SaveDto } from '@/app/com/apiGenerated';
import defaultMini from '@/assets/defaultMini.svg'
import iconLock from '@/assets/ui/lock.svg';
import iconPen from '@/assets/ui/pen.svg';
import iconWarn from '@/assets/ui/warn.svg';
import WarnRulePrompts from '@/pages/editors/components/WarnRulePrompts.vue';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { useRouter } from 'vue-router';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';
import { useSaveListLocalConfigStore } from '@/app/localConfig/saveListLocalConfig';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';
import { useApiStore } from '@/app/com/apiStore';

const saveListLocalConfig = useSaveListLocalConfigStore()
const api = useApiStore()
const enteredFromStore = useEnteredCanvasFromStore()
const props = defineProps<{
    s: SaveDto,
    size?: number,
    definitelyEditable?: boolean
}>()
const style = computed<CSSProperties>(()=>{
    if(props.size)
        return { width: props.size+'px', height: props.size+'px' }
    return {}
})

const { showPop } = useUniqueComponentsStore()
const { userInfo } = storeToRefs(useUserInfoStore())

interface SaveAvatarStatus{
    icon: string
    text: string
    color: string
    clickBehavior: 'refuse'|'wait'|'edit'
}
const status = computed<SaveAvatarStatus|undefined>(()=>{
    const s = sDisplay.value
    let res:SaveAvatarStatus|undefined = undefined
    if(!s.allowRequesterView){
        // 拒绝当前用户查看
        res = { icon: iconLock, text: '无权限', color: 'rgb(192, 57, 43)', clickBehavior: 'refuse' }
    }
    else if(s.allowRequesterEdit){
        // 允许当前用户编辑（但实际让不让编辑由“是否他人在编辑”决定）
        if(s.editingByUserId && s.editingByUserId != userInfo.value.id)
            res = { icon: iconPen, text: '占用中', color: 'rgb(212, 160, 23)', clickBehavior: 'wait'}
        else
            res = { icon: iconPen, text: '可编辑', color: 'rgb(39, 174, 96)', clickBehavior: 'edit' }
    }
    if(res && loadingStatus.value)
        res.text = '刷新中'
    return res
})
const hideStatus = computed(()=>{
    // 如果本组件用于“确定可编辑”的情况，那么就不显示“可编辑”状态，因为这是废话
    return props.definitelyEditable && status.value?.clickBehavior === 'edit'
})

const router = useRouter()
const { editorRoute } = useEditorsRoutesJump()
const promptSaveStatus = ref<SaveDto>()
const hasWarn = computed(()=>{
    return !!props.s.latestWarnContent
})
function openEditor(){
    const s = sDisplay.value
    if(!s.id) return
    // 强制重置promptSaveStatus以触发WarnRulePrompts的watch
    promptSaveStatus.value = undefined
    nextTick(()=>{
        if(hasWarn.value){
            promptSaveStatus.value = s
            return
        }
        if(hasRule.value){
            const readRuleId = saveListLocalConfig.readRuleCommentIds[s.id!]
            if(readRuleId && readRuleId === s.latestRuleCommentId){
                // 已读过当前Rule，直接进入
            } else {
                promptSaveStatus.value = s
                return
            }
        }
        const behave = status.value?.clickBehavior
        if(behave === 'refuse') // 提示用户权限不足
            showPop('根据权限设置\n无法查看该存档', 'failed')
        else // 进入编辑页面
            router.push(editorRoute(s.id!))
    })
}
function navigateToEditor(){
    const s = sDisplay.value
    if(!s.id) return
    enteredFromStore.markCommentPromptChecked(s.id)
    router.push(editorRoute(s.id))
}

const loadedStatus = ref<SaveDto>()
const loadingStatus = ref<boolean>(false)
async function handleStatusClick(){
    if(status.value?.clickBehavior != 'wait') return
    if(loadingStatus.value) return
    loadingStatus.value = true
    const res = await api.save.loadStatus(props.s.id, false)
    if(res){
        loadedStatus.value = res
        nextTick(()=>{
            if(status.value?.clickBehavior == 'wait'){
                showPop('状态已刷新\n请继续等待', 'warning')
            }
            else if(status.value?.clickBehavior == 'edit'){
                showPop('状态已刷新\n现在可以进入', 'success')
            }
        })
    }
    loadingStatus.value = false
}
const hasRule = computed(()=>{
    return !!props.s.latestRuleContent
})
const sDisplay = computed(()=>{
    // 如果有新加载的状态，则将其合并进props的值里（不修改props）
    const res = {...props.s}
    const source = loadedStatus.value ?? {}
    Object.assign(res, source)
    return res
})
</script>

<template>
<div class="save-avatar" :style="style">
    <img class="save-avatar-bg" :src="props.s.miniUrl ?? defaultMini" @click="openEditor"/>
    <img v-if="hasWarn" class="save-avatar-warn" :src="iconWarn" @click.stop/>
    <WarnRulePrompts :save-status="promptSaveStatus" mode="navigate" @navigate="navigateToEditor"></WarnRulePrompts>
    <div v-if="status && !hideStatus" class="save-avatar-status" :style="{backgroundColor: status.color}" @click.stop="handleStatusClick">
        <img :src="status.icon"/>
        <div>{{ status.text }}</div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.save-avatar{
    width: 90px;
    height: 90px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    margin: 0px auto;
    .save-avatar-bg{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        &:hover{
            cursor: pointer;
        }
    }
    .save-avatar-warn{
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50%;
        height: 50%;
        object-fit: contain;
        pointer-events: none;
        filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
    }
    .save-avatar-status{
        position: absolute;
        right: -46px;
        bottom: 0;
        height: 22px;
        padding: 0 2px;
        display: flex;
        align-items: center;
        border-radius: 5px 0px 0px 0px;
        box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.6);
        cursor: pointer;
        gap: 4px;
        img{
            width: 18px;
            height: 18px;
        }
        div{
            font-size: 14px;
            line-height: 14px;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-align: center;
        }
    }
    &:hover{
        box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.6);
        .save-avatar-status{
            right: 0px;
            filter: brightness(1.1);
        }
    }
}
</style>
