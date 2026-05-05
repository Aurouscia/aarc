<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRecentUpdateStore } from '@/app/globalStores/recentUpdate';

interface RecentUpdates{
    updates: Array<{
        author: string,
        date: string,
        content: string,
    }>;
}

const data = ref<RecentUpdates>();
const isError = ref(false);
const recentUpdateStore = useRecentUpdateStore();
const componentRef = ref<HTMLElement>();

// 判断是否有新更新（最新更新时间晚于已读时间）
const hasNewUpdate = computed(() => {
    if (!data.value?.updates?.length) return false;
    const latestUpdate = data.value.updates[0];
    if (!latestUpdate?.date) return false;
    const latestDate = new Date(latestUpdate.date).getTime();
    if (isNaN(latestDate)) return false;
    
    // 如果没有已读时间，视为有新更新
    if (!recentUpdateStore.lastReadTime) return true;
    
    const lastRead = new Date(recentUpdateStore.lastReadTime).getTime();
    if (isNaN(lastRead)) return true;
    
    return latestDate > lastRead;
});

// 滚动到本组件并标记为已读
function scrollToView() {
    componentRef.value?.scrollIntoView({ behavior: 'smooth' });
    recentUpdateStore.markAsRead();
}

async function loadRecentUpdates() {
    try {
        const resp = await fetch('/recentUpdates.json', { cache: 'no-store' });
        // 检查HTTP响应状态
        if (!resp.ok) {
            throw new Error(`最近更新：${resp.status}`);
        }
        const jsonData = await resp.json();
        // 验证数据格式是否符合预期
        if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.updates)) {
            throw new Error('最近更新：数据格式异常');
        }
        data.value = jsonData;
        isError.value = false;
    } catch (error) {
        console.error('最近更新：加载失败', error);
        isError.value = true;
        data.value = undefined;
    }
}

const msInOneDay = 1000 * 60 * 60 * 24;
const daysAgo = computed(()=>{
    const nearest =  data.value?.updates?.at(0)?.date
    if(nearest){
        const nearestDate = new Date(nearest)
        if(isNaN(nearestDate.getTime()))
            return
        const days = (Date.now() - nearestDate.getTime()) / msInOneDay
        if(days > 0)
            return Math.floor(days)
    }
})
const agoDisplay = computed(()=>{
    const days = daysAgo.value
    if(days === undefined)
        return
    if(days === 0)
        return ' (刚刚)'
    return ` (${days}天前)`
})

onMounted(async() => {
  await loadRecentUpdates();
})
</script>

<template>
  <!-- 查看更新按钮 -->
  <div v-if="hasNewUpdate" class="view-update-btn" @click="scrollToView">
    查看更新{{ agoDisplay }}
  </div>
  <div ref="componentRef" class="recent-updates" v-if="!isError">
    <h2 class="updates-title" v-if="data">
        <div>
            <span class="spark-mark">🔧</span>
            主要更新{{ agoDisplay }}
        </div>
        <a href="https://gitee.com/au114514/aarc/commits/master" target="_blank">查看所有更新</a>
    </h2>
    <div v-if="!data" class="loading">
      加载中...
    </div>
    <div v-else-if="data.updates && data.updates.length === 0" class="no-updates">
      暂无更新
    </div>
    <ul class="updates-list" v-else>
      <li v-for="(update, index) in data.updates" :key="index" class="update-item">
        <div class="update-author">
            {{ update.author }}
            <div class="update-date">
                {{ update.date }}
            </div>
        </div>
        <div class="update-content">{{ update.content }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.recent-updates {
    background-color: #eee;
    padding: 10px 10px;
    font-family: sans-serif;
    border-radius: 10px;
}

.spark-mark{
    display: inline-block;
    background-color: white;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    line-height: 26px;
    text-align: center;
}

.updates-title {
    font-size: 19px;
    font-weight: 600;
    color: #333;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    a{
        color: #999;
        font-size: 13px;
        font-weight: normal;
    }
}

.loading,
.no-updates {
    text-align: center;
    color: #666;
    padding: 40px 0;
    font-size: 16px;
}

.updates-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.update-item {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    gap: 8px;
    align-items: center;
    border-bottom: 1px solid #ccc;
    &:first-child{
        padding-top: 0px;
    }
    &:last-child {
        border-bottom: none;
        padding-bottom: 0px;
    }
}

.update-date {
    color: #999;
    font-size: 12px;
    font-weight: 400;
}

.update-author {
    font-weight: 500;
    color: #333;
    font-size: 15px;
    width: 100px;
    text-align: center;
    flex-shrink: 0;
}

.update-content {
    color: #666;
    font-size: 14px;
    white-space: pre-wrap;
}

.view-update-btn {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ff6b6b;
    color: white;
    padding: 10px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    z-index: 1000;
    transition: all 0.3s ease;
    
    &:hover {
        background-color: #ff5252;
        box-shadow: 0 6px 16px rgba(255, 107, 107, 0.5);
        transform: translateX(-50%) translateY(-2px);
    }
    
    &:active {
        transform: translateX(-50%) translateY(0);
    }
}
</style>