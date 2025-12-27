<script setup lang="ts">
import { computed, CSSProperties } from 'vue';
import { SaveDto } from '@/app/com/apiGenerated';
import defaultMini from '@/assets/defaultMini.svg'
import iconLock from '@/assets/ui/lock.svg';
import iconPen from '@/assets/ui/pen.svg';
import { useEditorsRoutesJump } from '../editors/routes/routesJump';
import { useRouter } from 'vue-router';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';

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
    const s = props.s
    if(!s.allowRequesterView){
        // 拒绝当前用户查看
        return { icon: iconLock, text: '无权限', color: 'rgb(192, 57, 43)', clickBehavior: 'refuse' }
    }
    if(s.allowRequesterEdit){
        // 允许当前用户编辑（但实际让不让编辑由“是否他人在编辑”决定）
        if(s.editingByUserId && s.editingByUserId != userInfo.value.id)
            return { icon: iconPen, text: '占用中', color: 'rgb(212, 160, 23)', clickBehavior: 'wait'}
        return { icon: iconPen, text: '可编辑', color: 'rgb(39, 174, 96)', clickBehavior: 'edit' }
    }
})
const hideStatus = computed(()=>{
    // 如果本组件用于“确定可编辑”的情况，那么就不显示“可编辑”状态，因为这是废话
    return props.definitelyEditable && status.value?.clickBehavior === 'edit'
})

const router = useRouter()
const { editorRoute } = useEditorsRoutesJump()
function openEditor(){
    if(!props.s.id) return
    if(status.value) {
        const behave = status.value.clickBehavior
        if(behave === 'edit') // 进入编辑界面
            router.push(editorRoute(props.s.id))
        else if(behave === 'wait') // 提示用户等待
            showPop(`请等待他人完成编辑：\n${props.s.editingByUserName}`, 'failed')
        else if(behave === 'refuse') // 提示用户权限不足
            showPop('根据权限设置\n无法查看该存档', 'failed')
    }
    else {
        // 如果无status，则是默认情况：只读模式进入
        router.push(editorRoute(props.s.id, {viewOnly: true}))
    }
}
</script>

<template>
<div class="save-avatar" :style="style" @click="openEditor">
    <img class="save-avatar-bg" :src="props.s.miniUrl ?? defaultMini"/>
    <div v-if="status && !hideStatus" class="save-avatar-status" :style="{backgroundColor: status.color}" @click.stop="()=>{}">
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