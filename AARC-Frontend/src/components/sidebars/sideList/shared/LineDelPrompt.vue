<script setup lang="ts">
import { Line } from '@/models/save';
import Prompt from '@/components/common/Prompt.vue';

defineProps<{
    params:{
        wantDelLine:Line|undefined,
        wantDelLineWithSta:boolean
    }
}>()
const emit = defineEmits<{
    (e:'abort'):void
    (e:'exe'):void
}>()
</script>

<template>
    <Prompt v-if="params.wantDelLine">
        <div class="promptDel">
            <div class="promptDeltitle">确定删除 {{ params.wantDelLine.name }}</div>
            <div class="promptDelSta">
                <input type="checkbox" v-model="params.wantDelLineWithSta"/> 同时删除其车站
            </div>
            <div class="promptDelBtns">
                <button class="minor" @click="emit('abort')">取消</button>
                <button class="danger" @click="emit('exe')">确认删除</button>
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