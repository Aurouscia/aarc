<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface RecentUpdates{
    updates: Array<{
        author: string,
        date: string,
        content: string,
    }>;
}

const data = ref<RecentUpdates>();
const isError = ref(false);

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

onMounted(async() => {
  await loadRecentUpdates();
})
</script>

<template>
  <div class="recent-updates" v-if="!isError">
    <h2 class="updates-title" v-if="data">
        <div>
            <span class="spark-mark">🔧</span>
            近期主要更新
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
</style>