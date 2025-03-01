<script setup lang="ts">
import Prompt from '@/components/common/Prompt.vue';
import { ref } from 'vue';

defineProps<{
    lineName:string|undefined
}>()
const withSta = ref(false)
const emit = defineEmits<{
    (e:'abort'):void
    (e:'exe', withSta:boolean):void
}>()
</script>

<template>
    <Prompt v-if="lineName">
        <div class="promptDel">
            <div class="promptDeltitle">确定删除 {{ lineName }}</div>
            <div class="promptDelSta">
                <input type="checkbox" v-model="withSta"/> 同时删除其车站
            </div>
            <div class="promptDelBtns">
                <button class="minor" @click="emit('abort'); withSta=false">取消</button>
                <button class="danger" @click="emit('exe', withSta); withSta=false">确认删除</button>
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