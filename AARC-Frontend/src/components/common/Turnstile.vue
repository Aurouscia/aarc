<script setup lang="ts">
import { onMounted } from 'vue'

const emit = defineEmits<{
    (e: 'verify', token: string): void
}>()
const siteKey = import.meta.env.VITE_TurnstileSiteKey

onMounted(() => {
    if (!siteKey) {
        console.warn('Turnstile site key 未配置')
        return
    }
    // 显式渲染
    let t = (window as any).turnstile
    t.render('#cf-turnstile', {
        sitekey: siteKey,
        theme: 'light',
        callback: (token:string) => emit('verify', token),
        'expired-callback': () => emit('verify', '')
    })
})
</script>

<template>
    <div id="cf-turnstile"></div>
</template>