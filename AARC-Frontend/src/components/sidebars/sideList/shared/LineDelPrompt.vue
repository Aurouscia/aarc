<script setup lang="ts">
import Prompt from '@/components/common/Prompt.vue';
import { Line } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { computed, ref } from 'vue';

const props = defineProps<{
    line?:Line,
    withStaDefault?:boolean,
    lineCalled:string,
    ptCalled:string
}>()

const saveStore = useSaveStore();
const lineColor = computed<string|undefined>(()=>{
    if(props.line)
        return saveStore.getLineActualColor(props.line)
})

const withSta = ref<boolean>(props.withStaDefault)
function withStaReturnToDefault(){
    withSta.value = props.withStaDefault
}
const emit = defineEmits<{
    (e:'abort'):void
    (e:'exe', withSta:boolean):void
}>()
</script>

<template>
    <Prompt v-if="line" :bg-click-close="true" @close="emit('abort')">
        <div class="promptDel">
            <div class="promptDeltitle">
                确定删除
                <span :style="{color: lineColor}">{{ line.name || '无名'+lineCalled }}</span>
            </div>
            <div class="promptDelSta">
                <input type="checkbox" v-model="withSta"/> 同时删除其{{ ptCalled }}
            </div>
            <div class="promptDelBtns">
                <button class="minor" @click="emit('abort'); withStaReturnToDefault()">取消</button>
                <button class="danger" @click="emit('exe', withSta); withStaReturnToDefault()">确认删除</button>
            </div>
        </div>
    </Prompt>
</template>

<style scoped lang="scss">
.promptDel{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    .promptDelTitle{
        text-align: center;
        font-size: 18px;
        font-weight: bold;
    }
    .promptDelSta, .promptDelBtns{
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
    }
    .promptDelSta{
        color: gray;
        gap: 5px;
    }
}
</style>