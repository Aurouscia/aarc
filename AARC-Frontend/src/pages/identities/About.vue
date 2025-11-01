<script lang="ts" setup>
import logoImg from '@/assets/logo/aarc-new.svg';
import { GitInfo } from '@/utils/gitInfo/gitInfoGen';
import { getGitInfo } from '@/utils/gitInfo/gitInfoGet'
import { onBeforeMount, ref } from 'vue';

const gitInfo = ref<GitInfo>()
onBeforeMount(async () => {
    gitInfo.value = await getGitInfo()
})
</script>

<template>
    <div class="about">
        <div class="logoContainer">
            <img :src="logoImg"/>
            <div class="appName0">
                <div class="ab">
                    <span>A</span>
                    <div class="af">Advanced 先进</div>
                </div>
                <div class="ab">
                    <span>A</span>
                    <div class="af">Abstract 抽象</div>
                </div>
                <div class="ab">
                    <span>R</span>
                    <div class="af">Route map 线路图</div>
                </div>
                <div class="ab">
                    <span>C</span>
                    <div class="af">Canvas 画布</div>
                </div>
            </div>
            <div class="appName1">线路图画布</div>
        </div>
        <div v-if="gitInfo" class="gitInfo">
            <div class="gitInfoItem">
                <div>提交</div>
                <div>{{ gitInfo.commitId }}</div>
            </div>
            <div class="gitInfoItem">
                <div>分支</div>
                <div>{{ gitInfo.branchName }}</div>
            </div>
            <div class="gitInfoItem">
                <div>构建于</div>
                <div>{{ gitInfo.builtAt }}</div>
            </div>
        </div>
        <div class="license">
            本项目以<a href="https://www.apache.org/licenses/LICENSE-2.0.html" target="_blank">Apache-2.0</a>许可证提供<br/>
            任何人有权下载、使用、修改、再分发本项目的源代码和可执行文件，且无需保持开源<br/>
            本项目的所有本地和云端功能都不会以任何方式收取费用
        </div>
        <div class="getSource">
            <a href="https://gitee.com/au114514/aarc" target="_blank">Gitee(本体)</a>&nbsp;
            <a href="https://github.com/Aurouscia/aarc" target="_blank">Github(自动同步镜像)</a>
        </div>
        <div class="thankList">
            <div>源码贡献者：
                <div v-if="gitInfo?.contributors" class="contributors">
                    <div v-for="c in gitInfo.contributors">
                        <div class="contributorName">{{ c.name }}</div>
                        <div>{{ c.count }}提交</div>
                    </div>
                    <div>
                        <div>(更新于{{ gitInfo.builtAt }})</div>
                    </div>
                </div>
            </div>
            <div>主要issue贡献者：滨蜀</div>
            <div>宣传大使：滨蜀</div>
            <div>新版logo设计者：三几几</div>
            <div>主要软件框架/工具：
                <a href="https://dotnet.microsoft.com/zh-cn/" target="_blank">.NET</a>、
                <a href="https://dotnet.microsoft.com/zh-cn/apps/aspnet" target="_blank">AspNetCore</a>、
                <a href="https://github.com/RicoSuter/NSwag" target="_blank">NSwag</a>、
                <a href="https://vuejs.org" target="_blank">Vue.js</a>、
                <a href="https://vite.dev" target="_blank">Vite</a>、
                <a href="https://www.typescriptlang.org" target="_blank">TypeScript</a>、
                <a href="https://sass-lang.com/" target="_blank">Sass</a>、
                <a href="https://www.nuget.org/packages/EzPinyin" target="_blank">EzPinyin</a>
            </div>
            <div>域名和服务器提供者：Au的父亲(武汉被看见科技有限公司)</div>
            <div>首批活跃用户：滨蜀、四氨合铜离子、Xueshen234、南京精灵的灵芝、哦、NonstopExpress、Hikorta等</div>
        </div>
        <div class="copyright">
            <div>
                版权所有© 2024-2025
                Au(<a href="https://github.com/Aurouscia" target="_blank">Aurouscia</a>/<a href="https://gitee.com/au114514" target="_blank">au114514</a>)<br/>
                保留所有权利(Apache-2.0中开放的除外)
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.about{
    padding-top: 40px;
    text-align: center;
    color: gray;
    a{
        text-decoration: underline;
    }
    &>*{
        margin-bottom: 20px;
    }
}
.thankList{
    font-size: 14px;
    text-align: left;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    .contributors{
        vertical-align: bottom;
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 5px;
        padding-right: 6px;
        &>div{
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: space-between;
            color: #666;
            background-color: #eee;
            &>div{
                height: 22px;
                padding: 0px 5px;
                font-size: 12px;
                white-space: nowrap;
                display: flex;
                align-items: center;
            }
            .contributorName{
                font-size: 14px;
                background-color: #666;
                color: white;
            }
            &, .contributorName{
                border-radius: 6px;
            }
        }
    }
}
.logoContainer{
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0px auto 20px auto;
    padding: 10px;
    border-radius: 30px;
    background-color: #f0f0f0;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    width: fit-content;
    img{
        width: 100px;
        height: 100px;
        margin-bottom: 4px;
    }
    .appName0{
        font-size: 22px;
        line-height: 28px;
        font-weight: bold;
        color: #333;
        display: flex;
        justify-content: center;
        gap: 8px;
        &>div{
            text-align: center;
            flex-basis: 16px;
            flex-shrink: 0;
            flex-grow: 0;
            border-bottom: 1.5px solid #999;
            overflow: visible;
            position: relative;
            cursor: pointer;
        }
        .af{
            position: absolute;
            font-size: 16px;
            top: -50px;
            height: 0px;
            padding: 0px 4px 0px 4px;
            box-sizing: border-box;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0px 0px 5px 0px black;
            left: 0px;
            opacity: 0;
            overflow: hidden;
            user-select: none;
            white-space: nowrap;
            display: flex;
            align-items: center;
            transition: 0.3s;
        }
        .ab:hover{
            background-color: #ddd;
            .af{
                top: -28px;
                height: 24px;
                padding: 4px;
                opacity: 1;
            }
        }
    }
    .appName1{
        font-size: 16px;
        margin-top: 6px;
        color: #666;
    }
}
.gitInfo{
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    font-size: 14px;
    margin: 20px auto;
    &>div{
        display: flex;
        align-items: center;
        gap: 12px;
        &>div{
            flex-grow: 1;
        }
        &>div:first-child{
            flex-basis: 0px;
            font-weight: bold;
            color: #aaa;
            text-align: right;
        }
        &>div:last-child{
            flex-basis: 40px;
            color: #666;
            text-align: left;
        }
    }
}
</style>