<script lang="ts" setup>
import { guideInfo } from '@/app/guideInfo';
import { convertToProxyUrlIfNeeded } from '@/utils/urlUtils/proxyUrl';

const gitUrl = 'https://gitee.com/au114514/aarc'
const exampleUrl = 'http://aarc.maritel.jowei19.com'
const exampleLogo = convertToProxyUrlIfNeeded('http://maritel.jowei19.com/maritelLogo.png', 'icon')
</script>

<template>
    <div class="derive-page">
        <header class="hero">
            <h1 class="hero-title">Fork AARC</h1>
            <p class="hero-desc">
                AARC 开源免费，支持 Windows Server 或 Docker 部署。
            </p>
            <p class="hero-desc">
                如果你和你的创作团队需要一个自主可控且不被打扰的环境，可以 Fork 一份本项目代码，根据自己的需求和喜好随意修改它，并把它运行在自己的服务器上。
            </p>
            <div class="hero-actions">
                <a class="btn primary" :href="gitUrl" target="_blank" rel="noopener">获取代码 / 部署指南</a>
                <a class="btn" :href="exampleUrl" target="_blank" rel="noopener">私服示范站点</a>
            </div>
        </header>

        <section class="section features">
            <div class="feature">
                <span class="feature-icon">🪟</span>
                <h3 class="feature-title">Windows Server</h3>
                <p class="feature-text">支持在 Windows Server 环境中部署运行，方便熟悉 Windows 生态的团队维护。</p>
            </div>
            <div class="feature">
                <span class="feature-icon">🐳</span>
                <h3 class="feature-title">Docker</h3>
                <p class="feature-text">提供 Docker 部署方式，便于快速上线、迁移和扩展。</p>
            </div>
            <div class="feature">
                <span class="feature-icon">🔧</span>
                <h3 class="feature-title">自由定制</h3>
                <p class="feature-text">代码完全开源，可根据团队需求随意修改功能、样式与业务逻辑。</p>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">私服示范站点</h2>
            <div class="fork-list">
                <a
                    class="card fork-card"
                    :href="exampleUrl"
                    target="_blank"
                    rel="noopener"
                >
                    <img class="fork-logo" :src="exampleLogo" alt="平浪风云参设组专属 AARC" />
                    <div class="fork-info">
                        <h3 class="card-title">平浪风云参设组专属 AARC</h3>
                        <p class="card-sub">基于 AARC Fork 的私服实例</p>
                    </div>
                </a>
            </div>
        </section>

        <footer class="footer">
            <p>开发/部署遇到问题：{{ guideInfo.findHelp }}</p>
        </footer>
    </div>
</template>

<style scoped lang="scss">
@use './styles/derive-intro-pages.scss';
</style>
