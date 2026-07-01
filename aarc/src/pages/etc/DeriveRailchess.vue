<script lang="ts" setup>
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents'
import copy from 'copy-to-clipboard'

import avatar from '@/assets/defaultAvatar.svg'

const url = 'https://railchess.jowei19.com'
const logo = 'https://railchess.jowei19.com/railchessLogo.svg'
const poster = 'https://railchess.jowei19.com/mor26poster.jpg'
const qqGroup = '302104258'

const playbacks = [
    {
        title: '双人奇袭局',
        url: 'https://railchess.jowei19.com/#/playback/14117/autoplay',
        map: '深圳2030+（简办动态演示作品）',
        playerNum: 2
    },
    {
        title: '四人缠斗局',
        url: 'https://railchess.jowei19.com/#/playback/14143/autoplay',
        map: '成华轨道交通（aarc 虚构作品）',
        playerNum: 4
    },
    {
        title: '七人混战局',
        url: 'https://railchess.jowei19.com/#/playback/12603/autoplay',
        map: '中国高速铁路线网图',
        playerNum: 7
    }
]

const { showPop } = useUniqueComponentsStore()
function copyQQGroup(){
    copy(qqGroup)
    showPop('已复制群号', 'success')
}
</script>

<template>
    <div class="derive-page">
        <header class="hero">
            <img class="hero-logo" :src="logo" alt="轨交棋" />
            <h1 class="hero-title">轨交棋</h1>
            <p class="hero-desc">
                一款基于线路图的多人在线益智游戏。玩家在图上沿着线路移动，尽可能多地“占领”车站，并堵截其他玩家的行动，最终获得最高分数。
            </p>
            <p class="hero-desc">
                你可以用已完成的 AARC 存档创建轨交棋的棋盘，并与朋友们进行一场 2-10 人的实时在线游戏。（图的来源不限，你可以使用任何来源的图）
            </p>
            <div class="hero-actions">
                <a class="btn primary" :href="url" target="_blank" rel="noopener">立即游玩</a>
                <a class="btn" href="https://railchess.jowei19.com/#/guide" target="_blank" rel="noopener">查看游戏规则</a>
                <a class="btn" @click="copyQQGroup">加入 QQ 群 {{ qqGroup }}</a>
            </div>
        </header>

        <section class="section">
            <h2 class="section-title">精彩对局回放</h2>
            <div class="card-grid">
                <a
                    v-for="item in playbacks"
                    :key="item.title"
                    class="card playback-card"
                    :href="item.url"
                    target="_blank"
                    rel="noopener"
                >
                    <div class="card-body">
                        <h3 class="card-title">{{ item.title }}</h3>
                        <p class="card-sub">{{ item.map }}</p>
                        <div class="avatar-row">
                            <img
                                v-for="i in item.playerNum"
                                :key="i"
                                class="avatar"
                                :src="avatar"
                                alt="玩家头像"
                            />
                        </div>
                    </div>
                </a>
            </div>
        </section>

        <section class="section">
            <div class="poster-wrap">
                <img class="poster" :src="poster" alt="轨交棋宣传图" />
            </div>
        </section>

        <footer class="footer">
            <p>寻找一同游玩的玩家：请加轨交棋 QQ 群 {{ qqGroup }}</p>
        </footer>
    </div>
</template>

<style scoped lang="scss">
@use './styles/derive-intro-pages.scss';

.poster-wrap {
    display: flex;
    justify-content: center;
    margin-top: 8px;

    .poster {
        width: 80vw;
        max-width: 400px;
        border-radius: 16px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }
}

.playback-card {
    text-align: center;
    justify-content: center;
    min-height: 120px;
}

.avatar-row {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: 12px;
}

.avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
}
</style>
