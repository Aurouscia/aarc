<script setup lang="ts">

interface ToolItem {
    name: string
    url: string
    author: string
    desc: string
    isNew?: boolean
}

const list: ToolItem[] = [
    {
        name: '滨蜀的小工具合集',
        url: 'http://binshu.jowei19.com',
        author: '滨蜀',
        desc: '包括实际走向绘图器在内的多种实用工具'
    },
    {
        name: '随机地名生成器',
        isNew: true,
        url: 'http://wiki.jowei19.com/#/w/di-ming-sheng-cheng-qi',
        author: '南京精灵的灵芝',
        desc: '随机组合字符生成地名'
    },
    {
        name: 'AARC-轨交棋转换器',
        url: 'http://railchess.jowei19.com/#/aarcConverter',
        author: 'SlinkierApple13',
        desc: '将aarc存档转换为可游玩的轨交棋地图'
    },
    {
        name: 'RMP-AARC转换器',
        url: 'http://binshu.jowei19.com/aarc/aarcrmp.html',
        author: '滨蜀',
        desc: 'RMP-AARC存档格式转换器'
    },
    {
        name: 'AARC-FicCloud转换器',
        url: 'http://wiki.jowei19.com/#/w/bsdazmdcq',
        author: '滨蜀',
        desc: 'AARC-FicCloud转换器'
    },
    {
        name: '地形图生成器',
        url: 'http://mapgen.jowei19.com',
        author: 'Au',
        desc: '生成指定参数的地形图，可用于线路图背景'
    }
]
</script>

<template>
<div class="app-tools">
    <div class="problem-notice">如使用遇到问题，请联系工具的作者</div>
    <div class="tools-grid">
        <a
            v-for="item in list"
            :key="item.url"
            class="tool-card"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
        >
            <div class="tool-header">
                <div class="tool-name">{{ item.name }}</div>
                <span v-if="item.isNew" class="tool-new-badge">NEW</span>
            </div>
            <div class="tool-author">作者：{{ item.author }}</div>
            <div class="tool-desc">{{ item.desc }}</div>
        </a>
    </div>
</div>
</template>

<style scoped lang="scss">
.app-tools {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}
.problem-notice {
    margin-bottom: 20px;
    padding: 12px 16px;
    background-color: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 8px;
    color: #ad6800;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 200px;
}
.tool-card {
    display: flex;
    flex-direction: column;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}
.tool-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}
.tool-name {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
}
.tool-new-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(255, 77, 79, 0.3);
    flex-shrink: 0;
}
.tool-author {
    font-size: 13px;
    color: #666666;
    margin-bottom: 12px;
}
.tool-desc {
    font-size: 14px;
    color: #444444;
    line-height: 1.5;
    flex-grow: 1;
}
</style>
