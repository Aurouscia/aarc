<script setup lang="ts">
import { guideInfo } from '@/app/guideInfo';
import { convertToProxyUrlIfNeeded } from '@/utils/urlUtils/proxyUrl';

const f3Url = 'http://wiki.jowei19.com'
const f3LogoUrl = convertToProxyUrlIfNeeded('http://wiki.jowei19.com/fcloud.svg', 'icon')
const gitUrl = 'https://gitee.com/au114514/fcloud3'
const showcaseImg = convertToProxyUrlIfNeeded('http://static.wiki.jowei19.com/upload/f5rvrshu.png', 'icon')

const workExamples = [
    {
        name: '东璨历史主线',
        subName: '丰富详尽的虚构历史设定',
        url: 'http://wiki.jowei19.com/#/w/history-Dongcan',
        img: convertToProxyUrlIfNeeded('http://static.wiki.jowei19.com/upload/xzbp1fvi.png', 'icon')
    },
    {
        name: '笃初人民共和国',
        subName: '优秀国家设定典范佳作',
        url: 'http://maritel.jowei19.com/#/w/19',
        img: convertToProxyUrlIfNeeded('http://static.maritel.jowei19.com/wikiFile/d3pvbrcb.png', 'icon')
    },
    {
        name: '北雪语',
        subName: '严谨完备的虚构语言设定',
        url: 'http://wiki.jowei19.com/#/w/10790',
        img: convertToProxyUrlIfNeeded('http://static.wiki.jowei19.com/wikiFile/vnyfujee.png', 'icon')
    }
]

const forkExamples = [
    {
        name: '平浪风云官网',
        subName: '定制化开发',
        url: 'http://maritel.jowei19.com',
        logo: convertToProxyUrlIfNeeded('http://maritel.jowei19.com/maritelLogo.png', 'icon')
    },
    {
        name: '善溪官网',
        subName: '深度定制化开发',
        url: 'http://tharmcthay.jowei19.com',
        logo: convertToProxyUrlIfNeeded('http://static.wiki.jowei19.com/upload/709390125.jpg', 'icon')
    },
    {
        name: '玉河官网',
        subName: '原版使用',
        url: 'http://jukho.jowei19.com',
        logo: convertToProxyUrlIfNeeded('http://wiki.jowei19.com/fcloud.svg', 'icon')
    }
]
</script>

<template>
    <div class="derive-page">
        <header class="hero">
            <img class="hero-logo" :src="f3LogoUrl" alt="FCloud3" />
            <h1 class="hero-title">FCloud3 wiki系统</h1>
            <p class="hero-desc">
                一款简单易用的类 wiki 系统，你和你的创作团队可以使用它轻松编辑带有文本、表格和图片的文章，
                使用目录系统分类整理，在首页展示最新作品，用来深度构造自己的架空世界观。
            </p>
            <div class="hero-actions">
                <a class="btn primary" :href="f3Url" target="_blank" rel="noopener">访问官网</a>
                <a class="btn" :href="gitUrl" target="_blank" rel="noopener">查看源码</a>
            </div>
        </header>

        <section class="section">
            <h2 class="section-title">优秀作品示例</h2>
            <div class="card-grid">
                <a
                    v-for="item in workExamples"
                    :key="item.name"
                    class="card example-card"
                    :href="item.url"
                    target="_blank"
                    rel="noopener"
                >
                    <div class="card-image-wrap">
                        <img class="card-image" :src="item.img" :alt="item.name" />
                    </div>
                    <div class="card-body">
                        <h3 class="card-title">{{ item.name }}</h3>
                        <p class="card-sub">{{ item.subName }}</p>
                    </div>
                </a>
            </div>
        </section>

        <section class="section features">
            <div class="feature">
                <span class="feature-icon">🚀</span>
                <h3 class="feature-title">与 AARC 联动</h3>
                <p class="feature-text">
                    启用“云端保存 svg”功能，将生成的链接放到 wiki 站的词条中，让词条内（例如某市地铁）始终显示最新版的线路图
                </p>
            </div>
            <div class="feature">
                <span class="feature-icon">🔓</span>
                <h3 class="feature-title">自由开源</h3>
                <p class="feature-text">
                    与 AARC 一样，FCloud3 也是开源的自由软件。你可以根据自己的需求和喜好随意修改它，并用于自己的网站（Linux 和 Windows 服务器均可）
                </p>
            </div>
            <div class="feature">
                <span class="feature-icon">🌐</span>
                <h3 class="feature-title">域名借用</h3>
                <p class="feature-text">
                    如果你的团队人数不少于 20 人，可以借用 jowei19.com 的域名开设网站
                </p>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">使用案例</h2>
            <div class="fork-list">
                <a
                    v-for="item in forkExamples"
                    :key="item.name"
                    class="card fork-card"
                    :href="item.url"
                    target="_blank"
                    rel="noopener"
                >
                    <img class="fork-logo" :src="item.logo" :alt="item.name" />
                    <div class="fork-info">
                        <h3 class="card-title">{{ item.name }}</h3>
                        <p class="card-sub">{{ item.subName }}</p>
                    </div>
                </a>
            </div>
            <div class="showcase-image-wrap">
                <img class="showcase-image" :src="showcaseImg" alt="FCloud3 使用案例展示" />
            </div>
        </section>

        <footer class="footer">
            <p>部署问题 / 申请借用域名：{{ guideInfo.findHelp }}</p>
        </footer>
    </div>
</template>

<style scoped lang="scss">
@use './styles/derive-intro-pages.scss';

.showcase-image-wrap {
    display: flex;
    justify-content: center;
    margin-top: 24px;

    .showcase-image {
        width: 100%;
        max-width: 420px;
        border-radius: 16px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }
}
</style>
