<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
    type:"info"|"warn"|"danger",
    title?:string,
    maxWidth?:string
}>();
const title = ref<string>();
onMounted(()=>{
    if(!props.title){
        if(props.type=='info'){
            title.value = "⚠ 注意"
        }else if(props.type=='warn'){
            title.value = "⚠ 注意"
        }else if(props.type=='danger'){
            title.value = "⚠ 警告"
        }
    }else{
        title.value = props.title;
    }
})
</script>

<template>
    <div class="noticeOuter">
        <div class="notice" :class="props.type" :style="{maxWidth:maxWidth}">
            <div class="noticeTitle">{{ title }}</div>
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.noticeTitle{
    font-size: 20px;
    padding-bottom: 3px;
    margin-bottom: 3px;
}
.notice.danger{
    background-color: red;
    color:white
}
.notice.warn{
    background-color: orange;
    color:white
}
.notice.info{
    background-color: #666;
    color:white
}
.notice{
    border-radius: 5px;
    padding: 10px;
    font-size: 14px;
    margin: 5px;
    white-space: wrap;
    text-align: left;
}
.noticeOuter{
    display: flex;
    justify-content: center;
}
</style>