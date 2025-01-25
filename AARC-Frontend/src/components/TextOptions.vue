<script setup lang="ts">
import { TextOptions } from '@/models/save';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { ref, watch } from 'vue';

const props = defineProps<{
    target?: TextOptions
}>()

function colorChangeHandler(c:string){
    if(props.target){
        props.target.color = c
        emit('changed')
    }
}
const picker = ref<InstanceType<typeof AuColorPicker>>()
watch(props, (newVal)=>{
    picker.value?.enforceTo(newVal.target?.color || '#000000')
})
const emit = defineEmits<{
    (e:'changed'):void
}>()
</script>

<template>
<div v-if="target" class="textOptions">
    <AuColorPicker ref="picker" @change="colorChangeHandler" @done="colorChangeHandler"
        :entry-styles="{border:'1.5px solid #eee'}"></AuColorPicker>
    <div class="textSize">
        <input type="range" v-model="target.size" :min="0.5" :max="3" :step="0.25" @change="emit('changed')"/>
        <input type="number" v-model="target.size" :min="0.5" :max="16" @change="emit('changed')"/>
    </div>
</div>
</template>

<style scoped lang="scss">
.textOptions{
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
}
.textSize{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    input[type=range]{
        margin: 0px;
    }
    input[type=number]{
        padding: 1px;
        margin: 0px;
        width: 70px;
        text-align: center;
    }
}
</style>