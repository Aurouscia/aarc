<script setup lang="ts">
import { SaveDto } from '@/app/com/apiGenerated';
import { useSaveListLocalConfigStore } from '@/app/localConfig/saveListLocalConfig';
import iconWarn from '@/assets/ui/warn.svg';
import Prompt from '@/components/common/Prompt.vue'
import { ref, watch } from 'vue';

const props = defineProps<{
    saveStatus?: SaveDto
    /** 'navigate': 显示"进入编辑"按钮，点击后emit navigate；'close': 显示"知道了"按钮，仅关闭 */
    mode?: 'navigate' | 'close'
}>()

const emit = defineEmits<{
    navigate: []
}>()

const saveListLocalConfig = useSaveListLocalConfigStore()
const rulePromptShow = ref(false)
const ruleDoNotShowAgain = ref(false)
const warnPromptShow = ref(false)

watch(() => props.saveStatus, (s) => {
    if (!s) return
    // 检查是否有warn，优先展示warn
    if (s.latestWarnContent) {
        warnPromptShow.value = true
        return
    }
    // 无warn，检查rule
    if (s.latestRuleContent && s.id && s.latestRuleCommentId) {
        const readRuleId = saveListLocalConfig.readRuleCommentIds[s.id]
        if (!readRuleId || readRuleId !== s.latestRuleCommentId) {
            rulePromptShow.value = true
        }
    }
}, { immediate: true })

function handleWarnPromptClose() {
    warnPromptShow.value = false
    // 关闭Warn后检查是否还有未读的Rule
    const s = props.saveStatus
    if (s?.latestRuleContent && s.id && s.latestRuleCommentId) {
        const readRuleId = saveListLocalConfig.readRuleCommentIds[s.id]
        if (!readRuleId || readRuleId !== s.latestRuleCommentId) {
            rulePromptShow.value = true
        }
    }
}

function handleRulePromptClose() {
    const s = props.saveStatus
    if (ruleDoNotShowAgain.value && s?.id && s.latestRuleCommentId) {
        saveListLocalConfig.readRuleCommentIds[s.id] = s.latestRuleCommentId
    }
    rulePromptShow.value = false
    ruleDoNotShowAgain.value = false
}

function handleRulePrimaryAction() {
    const s = props.saveStatus
    if (ruleDoNotShowAgain.value && s?.id && s.latestRuleCommentId) {
        saveListLocalConfig.readRuleCommentIds[s.id] = s.latestRuleCommentId
    }
    if (props.mode === 'navigate') {
        emit('navigate')
    }
    rulePromptShow.value = false
    ruleDoNotShowAgain.value = false
}

function handleWarnPrimaryAction() {
    warnPromptShow.value = false
    // 关闭Warn后检查是否还有未读的Rule，有则显示Rule而不是进入编辑
    const s = props.saveStatus
    if (s?.latestRuleContent && s.id && s.latestRuleCommentId) {
        const readRuleId = saveListLocalConfig.readRuleCommentIds[s.id]
        if (!readRuleId || readRuleId !== s.latestRuleCommentId) {
            rulePromptShow.value = true
            return
        }
    }
    // 无未读Rule，才进入编辑
    if (props.mode === 'navigate') {
        emit('navigate')
    }
}
</script>

<template>
    <Prompt v-if="warnPromptShow" bg-click-close @close="handleWarnPromptClose">
        <div class="warn-prompt">
            <img :src="iconWarn" />
            <div class="warn-content">{{ saveStatus?.latestWarnContent }}</div>
            <div class="warn-meta">
                <span>{{ saveStatus?.latestWarnBy }}</span>
                <span>{{ saveStatus?.latestWarnCreated }}</span>
            </div>
            <div class="warn-meta">编辑后，管理员会检查并消除本警告</div>
        </div>
        <button class="major" @click="handleWarnPrimaryAction()">
            {{ mode === 'navigate' ? '进入编辑' : '知道了' }}
        </button>
    </Prompt>
    <Prompt v-if="rulePromptShow" bg-click-close @close="handleRulePromptClose">
        <div class="rule-prompt">
            <div class="rule-label">编辑规则</div>
            <div class="rule-content">{{ saveStatus?.latestRuleContent }}</div>
            <div class="rule-meta">{{ saveStatus?.latestRuleCreated }}</div>
            <label class="do-not-show-again">
                <input type="checkbox" v-model="ruleDoNotShowAgain" />
                <span>不再显示本条</span>
            </label>
        </div>
        <button class="major" @click="handleRulePrimaryAction()">
            {{ mode === 'navigate' ? '进入编辑' : '知道了' }}
        </button>
    </Prompt>
</template>

<style scoped lang="scss">
.warn-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 200px;
    max-width: 300px;
    margin-bottom: 8px;

    img {
        width: 40px;
        height: 40px;
    }

    .warn-content {
        font-size: 16px;
        color: #c0392b;
        text-align: center;
        word-break: break-word;
    }

    .warn-meta {
        display: flex;
        gap: 8px;
        font-size: 12px;
        color: #666;
    }
}

.rule-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 200px;
    max-width: 300px;
    margin-bottom: 8px;

    .rule-label {
        font-size: 14px;
        color: #3498db;
        font-weight: bold;
    }

    .rule-content {
        font-size: 16px;
        color: #2c3e50;
        text-align: center;
        word-break: break-word;
    }

    .rule-meta {
        font-size: 12px;
        color: #666;
    }

    .do-not-show-again {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #666;
        cursor: pointer;

        input {
            cursor: pointer;
        }
    }
}

.major {
    display: block;
    margin: auto;
}
</style>
