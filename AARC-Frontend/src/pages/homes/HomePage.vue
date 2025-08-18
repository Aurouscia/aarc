<script setup lang="ts">
import { guideInfo } from '@/app/guideInfo';
import NewestSaves from '../components/NewestSaves.vue';
import GiteeInfo from '@/components/common/GiteeGitInfo.vue';
import Notice from '@/components/common/Notice.vue';
import { onMounted } from 'vue';
import { appVersionCheck } from '@/app/appVersionCheck';
import SearchSaveEntrance from '../components/SearchSaveEntrance.vue';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';

const { setEnteredFrom } = useEnteredCanvasFromStore()

onMounted(()=>{
    appVersionCheck()
    setEnteredFrom()
})
</script>

<template>
<div class="welcome">
    <h1>欢迎</h1>
    <p>AARC是用于绘制抽象线路图的工具，欢迎试用当前的<b>抢先体验版</b>（后续更新不会删档）</p>
    <p>
        <b>
            <a style="color:green" href="/#/Editor/demo">点击此处立即试用</a>&nbsp;
            <a style="color:blueviolet" href="http://aarc.jowei19.com/#/Editor/188">使用说明</a>&nbsp;
            <a style="color:#cc88cc" href="/#/FAQ">常见问题</a>
        </b>
    </p>
    <p style="color: #2C71BD">正式使用，请注册账户并登录、在“作品-我的作品”中点击新建，并进入编辑</p>
    <p>{{ guideInfo.findHelp }}</p>
    <p>本项目正在持续完善改进中，想提出建议请qq私聊我或<a href="https://gitee.com/au114514/aarc/issues" target="_blank">点击此处</a></p>
</div>
<div style="margin: 20px 0px 20px 0px;">
    <NewestSaves></NewestSaves>
</div>
<div style="margin: 20px 0px 20px 0px;">
    <SearchSaveEntrance></SearchSaveEntrance>
</div>
<div class="releaseNotes">
    <Notice :type="'info'" :title="'2025-08-18更新'">
        1. 站名拼音转换：修复死循环bug、添加“整体首字母大写”模式<br/>
        2. 可从某点拆分线路（在点的设置侧栏中）
    </Notice>
    <Notice :type="'info'" :title="'正在开发'">
        1. 标签/站名的旋转和压缩<br/>
        2. 多选和创建“元素组”功能<br/>
        3. 站点/线路搜索定位功能<br/>
        4. 指定线路导出<br/>
    </Notice>
</div>
<GiteeInfo></GiteeInfo>
<div class="roadmap">
    <h2>近期规划</h2>
    <div class="done">
        <h3>自由插入图片（已完成✔）</h3>
        <p>作为公司logo、特殊站标识、底图参考等</p>
    </div>
    <div class="done">
        <h3>画廊（已完成✔）</h3>
        <p>展示全站所有最新作品（略缩图）</p>
    </div>
    <div class="done">
        <h3>动态清晰度（已完成✔）</h3>
        <p>减小大型画布的内存占用，自由调整导出图片的像素</p>
    </div>
    <div class="done">
        <h3>支线整理（已完成✔）</h3>
        <p>把同一线路系统的各支线合并整理</p>
    </div>
    <div>
        <h3>时间轴</h3>
        <p>每个线路(段)可设置规划/建设/投运/废弃的年代，并查看/导出不同年代的线路图</p>
    </div>
    <div class="done">
        <h3>旧版迁移（已完成✔）</h3>
        <p>将旧版绘图器存档转换为新版的</p>
    </div>
    <h2>中期规划</h2>
    <div>
        <h3>客流量模拟计算</h3>
        <p>设置城市地图各处的住宅/消费/岗位密度，模拟并可视化各线路/区间的客流量</p>
    </div>
    <div class="done">
        <h3>丰富线路样式（已完成✔）</h3>
        <p>虚线和不同宽度的多层描边</p>
    </div>
    <div>
        <h3>丰富站点/标签样式</h3>
        <p>提供多种可选的站点/线路标签风格（可扩展性）</p>
    </div>
    <div>
        <h3>区间标记</h3>
        <p>高架、单向运行、施工中、规划中</p>
    </div>
    <div class="done">
        <h3>出站换乘标记（已完成✔）</h3>
        <p>连接邻近站点的虚线，标识它们可以出站换乘</p>
    </div>
    <div>
        <h3>导入/导出站名列表</h3>
        <p>以txt或excel格式导入/导出站名列表，无需进入编辑器快速替换站名</p>
    </div>
    <div>
        <h3>快捷站名</h3>
        <p>站名随机生成、中→英按格式转换、站名重复检查(?)</p>
    </div>
    <h2>远期规划</h2>
    <div>
        <h3>多人协作</h3>
        <p>支持多个用户同时编辑一张画布，任何操作都会立即同步给其他用户</p>
    </div>
    <div>
        <h3>游戏</h3>
        <p>基于上述客流量功能的竞技游戏，多个玩家在同一地图中，以同样造价获取更高的客流量</p>
    </div>
    <div>
        <h3>任意线路图导入（存疑）</h3>
        <p>任意一张png线路图，可由算法和OCR转换为本工具的存档</p>
    </div>
</div>
<div class="openSourceNote">
    本项目以<a href="https://apache.org/licenses/LICENSE-2.0" target="_blank">Apache-2.0</a>开源许可证提供，可私有部署和商用。
    欢迎对本项目源码作出贡献或提出改进意见。<br/>
    <a href="https://gitee.com/au114514/aarc" target="_blank">Gitee(本体)</a>&nbsp;
    <a href="https://github.com/Aurouscia/aarc" target="_blank">Github(自动同步镜像)</a>
    <div>本项目将用户的劳动成果保护放在第一位，不限制保存次数，请尽可能多保存。若出现误操作/他人破坏/恶性bug导致进度大量丢失，可联系服主获取备份。</div>
    <div style="color:cornflowerblue">承诺：不管后期添加多少功能，本项目永不以任何形式收取任何费用，所有功能全部开源免费。</div>
</div>
</template>

<style scoped lang="scss">
.releaseNotes{
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   align-items: flex-start;
   gap: 10px;
}
.welcome{
    h1, p{
        text-align: center;
        color: #999;
        margin-bottom: 0.5em;
    }
    h1{
        font-size: 30px;
    }
    a{
        text-decoration: underline;
        color: #999;
        &:hover{
            color: #333;
        }
    }
}
.roadmap{
    margin-top: 30px;
    h2{
        text-align: center;
        font-size: 22px;
        border: solid;
        border-width: 0px 2px 0px 2px;
        margin: auto;
        margin-top: 10px;
        width: 120px;
    }
    h3{
        font-size: 18px;
    }
    h3, p{
        color: #999;
        text-align: center;
    }
    &>div{
        margin: 20px 0px 20px 0px;
    }
    p{
        font-size: 14px;
    }
    .done{
        h3, p{
            color: #ddd;
        }
    }
}
.openSourceNote{
    font-size: 14px;
    padding: 30px 0px 30px 0px;
    text-align: center;
    color: #aaa;
    a{
        text-decoration: underline;
        color: #aaa;
        &:hover{
            color: #333;
        }
    }
}
</style>