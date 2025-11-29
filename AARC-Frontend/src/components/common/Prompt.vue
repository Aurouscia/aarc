<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{
    bgClickClose?: boolean,
    closeBtn?: string|true,
    closeBtnDelay?: number
}>(), {
    bgClick: false,
    closeBtn: undefined,
    closeBtnDelay: 0
})
const emit = defineEmits<{
    (e:'close'): void
}>()

const closeBtnText = computed(()=>{
    if(typeof props.closeBtn == 'string')
        return props.closeBtn
    return '我知道了'
})
const closeBtnActive = ref(false)
const closeBtnCountDown = ref<number>(100)
function handleCloseBtnClick(){
    if(!closeBtnActive.value)
        return
    emit('close')
}
function initCloseBtn(){
    if(!props.closeBtn)
        return
    if(props.closeBtnDelay){
        closeBtnActive.value = false
        closeBtnCountDown.value = Math.round(props.closeBtnDelay)
        let timer = window.setInterval(()=>{
            closeBtnCountDown.value--
            if(closeBtnCountDown.value < 0){
                closeBtnActive.value = true
                window.clearInterval(timer)
            }
        }, 1000)
    }else{
        closeBtnActive.value = true
        closeBtnCountDown.value = -1
    }
}

onMounted(()=>{
    initCloseBtn()
})
</script>

<template>
    <div class="prompt fixFill">
        <div class="background fixFill" @click="()=>{bgClickClose && emit('close')}"></div>
        <div class="panel">
            <slot></slot>
            <button v-if="closeBtn" class="closeBtn" @click="handleCloseBtnClick"
                :class="closeBtnActive?'':'minor'">
                {{ closeBtnText }}
                <template v-if="closeBtnCountDown >= 0">
                    ({{ closeBtnCountDown }})
                </template>
            </button>
        </div>
    </div>
</template>

<style scoped>
.prompt{
    z-index: 20000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.fixFill{
    position: fixed;
    inset: 0px;
}
.background{
    background-color: black;
    opacity: 0.2;
}
.panel{
    border-radius: 10px;
    box-shadow: 0 0 10px 0 black;
    background-color: white;
    padding: 10px 20px;
    margin: 20px;
    z-index: 20001;
}
.closeBtn{
    display: block;
    margin: 10px auto 0px;
    transition: 0s;
}
</style>