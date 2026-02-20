<script lang="ts" setup>
import { ref, watch } from 'vue';
import foldIcon from '@/assets/ui/fold.svg';

const props = defineProps<{
    title: string,
    special?: boolean,
    defaultShow?: boolean,
    noTitle?: boolean
}>()
const emit = defineEmits<{
    (e: 'show'):void,
    (e: 'hide'):void
}>()

const show = ref(props.defaultShow??false);

watch(()=>show.value, (newVal)=>{
    if(newVal){
        emit('show')
    }else{
        emit('hide')
    }
})
</script>

<template>
<div class="configSection">
    <h2 v-if="!noTitle" :class="{sectorShown:show}" @click="show = !show">
        <div class="shownStatusIcon">
            <img :src="foldIcon"/>
        </div>
        <div :class="{special}">{{ title }}</div>
    </h2>
    <slot v-if="show"></slot>
</div>
</template>