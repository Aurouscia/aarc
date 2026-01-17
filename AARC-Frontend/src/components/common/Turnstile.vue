<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'

interface TurnstileWindow extends Window {
    turnstile?: {
        render: (container: string, options: {
            sitekey: string
            theme: string
            callback: (token: string) => void
            'expired-callback': () => void
            'error-callback'?: () => void
        }) => string
        reset: (widgetId: string) => void
        remove: (widgetId: string) => void
    }
}

const emit = defineEmits<{
    (e: 'verify', token: string): void
    (e: 'error', message: string): void
}>()

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

const siteKey = import.meta.env.VITE_TurnstileSiteKey
const statusText = ref('')
const statusError = ref(false)
const isLoading = ref(false)
const widgetId = ref<string | null>(null)
let scriptElement: HTMLScriptElement | null = null

const loadTurnstileScript = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        // 检查脚本是否已存在
        const existingScript = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`)
        if (existingScript) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = TURNSTILE_SCRIPT_URL
        script.async = true
        script.defer = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Turnstile script'))
        document.head.appendChild(script)
        scriptElement = script
    })
}

const handleError = (error: string) => {
    console.error('Turnstile error:', error)
    statusError.value = true
    statusText.value = '人机验证出错，请刷新重试'
    emit('error', error)
}

const handleExpired = () => {
    statusText.value = '验证已过期，请重新验证'
    emit('verify', '')
}

const handleSuccess = (token: string) => {
    statusText.value = '验证成功'
    statusError.value = false
    emit('verify', token)
}

onMounted(async () => {
    if (!siteKey) {
        console.warn('Turnstile site key 未配置')
        statusError.value = true
        statusText.value = '人机验证配置异常，请联系管理员'
        emit('error', 'Site key not configured')
        return
    }

    isLoading.value = true

    try {
        await loadTurnstileScript()
        
        const turnstileWindow = window as unknown as TurnstileWindow
        if (!turnstileWindow.turnstile) {
            throw new Error('Turnstile not available after script load')
        }

        widgetId.value = turnstileWindow.turnstile.render('#cf-turnstile', {
            sitekey: siteKey,
            theme: 'light',
            callback: handleSuccess,
            'expired-callback': handleExpired,
            'error-callback': () => handleError('Turnstile rendering failed')
        })

        if (!widgetId.value) {
            throw new Error('Failed to render Turnstile widget')
        }
    } catch (error) {
        handleError(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
        isLoading.value = false
    }
})

onUnmounted(() => {
    // 清理资源
    if (widgetId.value) {
        const turnstileWindow = window as unknown as TurnstileWindow
        if (turnstileWindow.turnstile) {
            try {
                turnstileWindow.turnstile.remove(widgetId.value)
            } catch (error) {
                console.warn('Failed to remove Turnstile widget:', error)
            }
        }
    }

    // 移除脚本元素（如果是我们添加的）
    if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement)
    }
})
</script>

<template>
    <div class="turnstile-container">
        <div 
            id="cf-turnstile" 
            :class="{ 'loading': isLoading }"
            :style="{ minHeight: isLoading ? '65px' : 'auto' }">
        </div>
        <div 
            class="status-text" 
            :class="{ 'status-error': statusError, 'status-success': !statusError && !isLoading }">
            {{ statusText || '人机验证加载中，请稍候' }}
        </div>
    </div>
</template>

<style scoped>
.turnstile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.status-text {
    font-size: 12px;
    text-align: center;
    transition: color 0.3s ease;
    color: #666;
}

.status-error {
    color: #dc3545;
}

.status-success {
    color: #28a745;
}

.loading {
    opacity: 0.7;
    pointer-events: none;
}

#cf-turnstile {
    transition: opacity 0.3s ease;
}
</style>