<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore'
import { SaveCommentType, type SaveCommentDto } from '@/app/com/apiGenerated'
import { useUserInfoStore } from '@/app/globalStores/userInfo'
import { computed, ref, watch } from 'vue'
import Prompt from './Prompt.vue'

const props = defineProps<{
    saveId: number
    isOwner?: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const api = useApiStore()
const userInfoStore = useUserInfoStore()
const comments = ref<SaveCommentDto[]>([])
const loading = ref(false)
const hasMore = ref(true)
const skip = ref(0)
const take = 20

const content = ref('')
const commentType = ref<SaveCommentType>(SaveCommentType.Rule)
const typeOptions = computed(() => {
    const opts = []
    if (props.isOwner) {
        opts.push({ label: '规则', value: SaveCommentType.Rule })
    }
    if (userInfoStore.isAdmin) {
        opts.push({ label: '警告', value: SaveCommentType.Warn })
    }
    return opts
})

const canSendAny = computed(() => typeOptions.value.length > 0)

watch(typeOptions, (opts) => {
    if (opts.length > 0 && !opts.find(o => o.value === commentType.value)) {
        commentType.value = opts[0].value
    }
}, { immediate: true })

async function loadComments(reset = false) {
    if (loading.value) return
    loading.value = true
    if (reset) {
        skip.value = 0
        comments.value = []
        hasMore.value = true
    }
    const res = await api.saveComment.get(props.saveId, skip.value, take)
    if (res) {
        if (res.length < take) {
            hasMore.value = false
        }
        comments.value.push(...res)
        skip.value += res.length
    }
    loading.value = false
}

async function submitComment() {
    const text = content.value.trim()
    if (!text) return
    const res = await api.saveComment.add(props.saveId, text, commentType.value)
    if (res) {
        content.value = ''
        await loadComments(true)
    }
}

async function deprecateComment(id: number) {
    if (!window.confirm('确定要标记此留言为已废弃吗？')) return
    const res = await api.saveComment.setDeprecated(id)
    if (res) {
        await loadComments(true)
    }
}

const canSubmit = computed(() => content.value.trim().length > 0)

loadComments(true)
</script>

<template>
    <Prompt bg-click-close close-btn @close="emit('close')">
        <h2>存档留言</h2>
        <div class="commentList">
            <div class="list">
                <div v-for="c in comments" :key="c.id" class="item" :class="{
                    rule: c.type === SaveCommentType.Rule,
                    warn: c.type === SaveCommentType.Warn,
                    deprecated: c.deprecated
                }">
                    <div class="meta">
                        <span class="author">{{ c.authorUserName || '未知用户' }}</span>
                        <span class="time">{{ c.created }}</span>
                        <span v-if="c.type === SaveCommentType.Rule" class="tag ruleTag">规则</span>
                        <span v-if="c.type === SaveCommentType.Warn" class="tag warnTag">警告</span>
                        <span v-if="!c.deprecated && c.ownerUserId === userInfoStore.userInfo.id" class="deprecateBtn" @click="deprecateComment(c.id!)">×</span>
                    </div>
                    <div class="content">
                        <s v-if="c.deprecated">{{ c.content }}</s>
                        <template v-else>{{ c.content }}</template>
                    </div>
                </div>
                <div v-if="comments.length === 0 && !loading" class="empty">暂无留言</div>
                <div v-if="loading" class="loading">加载中...</div>
            </div>
            <div v-if="hasMore && !loading" class="loadMore">
                <button class="minor" @click="loadComments()">加载更多</button>
            </div>
            <div v-if="canSendAny" class="controls">
                <select v-model="commentType">
                    <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
                <textarea v-model="content" rows="3" placeholder="输入留言内容..."></textarea>
                <button :disabled="!canSubmit" @click="submitComment" class="ok">发送</button>
            </div>
        </div>
    </Prompt>
</template>

<style scoped>
.commentList {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 260px;
}
.list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
}
.item {
    padding: 8px 12px;
    border-radius: 6px;
    background-color: #f5f5f5;
}
.item.rule {
    background-color: #e8f4fd;
    border-left: 3px solid #1890ff;
}
.item.warn {
    background-color: #fff2f0;
    border-left: 3px solid #ff4d4f;
}
.meta {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}
.author {
    font-weight: bold;
    color: #333;
}
.tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
}
.ruleTag {
    background-color: #1890ff;
    color: white;
}
.warnTag {
    background-color: #ff4d4f;
    color: white;
}
.item.deprecated {
    filter: saturate(0.5);
}
.deprecateBtn {
    margin-left: auto;
    cursor: pointer;
    color: #999;
    font-size: 14px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
}
.deprecateBtn:hover {
    color: #ff4d4f;
    background-color: #f5f5f5;
}
.empty,
.loading {
    text-align: center;
    color: #999;
    padding: 20px;
}
.loadMore {
    text-align: center;
}
.controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    align-items: center;
}
.controls select {
    width: 120px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
}
.controls textarea {
    resize: vertical;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    font-size: 14px;
    width: 100%;
    max-width: 300px;
}
.controls button {
    padding-left: 20px;
    padding-right: 20px;
}
h2 {
    text-align: center;
    margin-bottom: 10px;
}
</style>
