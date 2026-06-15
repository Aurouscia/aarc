<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { SaveWarnDto } from '@/app/com/apiGenerated';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useEditorsRoutesJump } from '@/pages/editors/routes/routesJump';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const api = useApiStore()
const router = useRouter()
const { editorRoute } = useEditorsRoutesJump()
const userInfoStore = useUserInfoStore()
const { setEnteredFrom } = useEnteredCanvasFromStore()

const warns = ref<SaveWarnDto[]>([])
const loading = ref(false)
const error = ref('')

const isAdmin = computed(() => userInfoStore.isAdmin)

async function loadWarns() {
    loading.value = true
    error.value = ''
    try {
        const res = await api.saveComment.getAllWarns()
        if (res) {
            warns.value = res
        }
    } catch (e) {
        error.value = '加载失败'
    } finally {
        loading.value = false
    }
}

function openEditor(saveId: number | undefined) {
    if (!saveId) return
    setEnteredFrom()
    router.push(editorRoute(saveId))
}

function openUserSaves() {
    router.push({ name: 'mySaves' })
}

function formatTimeDiff(created: string | undefined, saveLastActive: string | undefined): string | null {
    if (!created || !saveLastActive) return null
    const createdDate = new Date(created.replace(' ', 'T'))
    const activeDate = new Date(saveLastActive.replace(' ', 'T'))
    const diffMs = activeDate.getTime() - createdDate.getTime()
    if (diffMs <= 0) return null
    const diffMinutes = Math.floor(diffMs / 60000)
    if (diffMinutes < 60) {
        return `${diffMinutes}分钟`
    }
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}小时`
}

async function deprecateWarn(id: number | undefined) {
    if (!id) return
    if (!window.confirm('确定要消除此提醒吗？')) return
    try {
        const res = await api.saveComment.setDeprecated(id)
        if (res) {
            await loadWarns()
        }
    } catch (e) {
        error.value = '操作失败'
    }
}

onMounted(() => {
    loadWarns()
})
</script>

<template>
    <div class="save-warns-page">
        <h1>存档问题提醒</h1>
        <div v-if="loading" class="loading">
            加载中...
        </div>
        <div v-else-if="error" class="error">
            {{ error }}
        </div>
        <div v-else-if="warns.length === 0" class="empty">
            暂无有效提醒
        </div>
        <div v-else class="warn-list">
            <div v-for="w in warns" :key="w.id" class="warn-item">
                <div class="warn-header">
                    <span class="save-name" @click="openEditor(w.saveId)">{{ w.saveName }}</span>
                    <div class="header-right">
                        <span class="save-owner" @click="openUserSaves">所有者: {{ w.saveOwnerName }}</span>
                    </div>
                </div>
                <div class="warn-body">
                    <div class="warn-content">{{ w.content }}</div>
                    <div class="warn-meta">
                        <span>提醒者: {{ w.commentAuthorName }}</span>
                        <span>提醒时间: {{ w.created }}</span>
                    </div>
                </div>
                <div class="warn-footer">
                    <div class="footer-left">
                        <span>存档上次更新: {{ w.saveLastActive }}</span>
                        <span v-if="formatTimeDiff(w.created, w.saveLastActive)" class="time-diff">
                            更新滞后: {{ formatTimeDiff(w.created, w.saveLastActive) }}
                        </span>
                    </div>
                    <div class="footer-right">
                        <button v-if="isAdmin" class="cancel" @click="deprecateWarn(w.id)">消除</button>
                        <button @click="openEditor(w.saveId)">进入查看</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.save-warns-page {
    max-width: 900px;
    margin: 0 auto;

    h1 {
        font-size: 24px;
        margin-bottom: 20px;
        color: #2c3e50;
    }

    .no-auth,
    .loading,
    .error,
    .empty {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 16px;
    }

    .error {
        color: #e74c3c;
    }

    .warn-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .warn-item {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

        .warn-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;

            .save-name {
                font-size: 18px;
                font-weight: bold;
                color: #3498db;
                cursor: pointer;

                &:hover {
                    text-decoration: underline;
                }
            }

            .save-owner {
                font-size: 14px;
                color: #666;
                cursor: pointer;

                &:hover {
                    color: #3498db;
                }
            }
        }

        .warn-body {
            margin-bottom: 12px;

            .warn-content {
                font-size: 16px;
                color: #c0392b;
                margin-bottom: 8px;
                word-break: break-word;
            }

            .warn-meta {
                display: flex;
                gap: 16px;
                font-size: 13px;
                color: #666;
            }
        }

        .warn-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #999;

            .footer-left {
                display: flex;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;

                .time-diff {
                    color: #e67e22;
                    font-weight: bold;
                }
            }

            .footer-right {
                display: flex;
                gap: 6px;
                align-items: center;
                button{
                    padding-left: 10px;
                    padding-right: 10px;
                }
            }

            @media (max-width: 520px) {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;

                .footer-left {
                    align-self: flex-start;
                }

                .footer-right {
                    align-self: flex-end;
                }
            }
        }
    }
}
</style>
