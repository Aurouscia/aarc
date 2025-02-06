<script setup lang="ts">
import { guideInfo } from '@/app/guideInfo';


</script>

<template>
<div class="welcome">
    <h1>欢迎</h1>
    <p>AARC是用于绘制抽象线路图的工具，欢迎试用当前的<b>抢先体验版</b>（后续更新不会删档）</p>
    <p><b><a style="color:green" href="/#/Editor/demo">点击此处立即试用</a></b></p>
    <p style="color: #2C71BD">正式使用，请注册账户并登录、在“作品-我的作品”中点击新建，并进入编辑</p>
    <p>{{ guideInfo.findHelp }}</p>
    <p>本项目正在持续完善改进中，想提出建议请qq私聊我或<a href="https://gitee.com/au114514/aarc/issues" target="_blank">点击此处</a></p>
</div>
<div class="roadmap">
    <h2>近期规划</h2>
    <div>
        <h3>自由插入图片</h3>
        <p>作为公司logo、特殊站标识、底图参考等</p>
    </div>
    <div>
        <h3>画廊</h3>
        <p>展示全站所有最新作品（略缩图）</p>
    </div>
    <div class="done">
        <h3>动态清晰度（已完成✔）</h3>
        <p>减小大型画布的内存占用，自由调整导出图片的像素</p>
    </div>
    <div>
        <h3>支线整理</h3>
        <p>把同一线路系统的各支线合并整理</p>
    </div>
    <div class="done">
        <h3>旧版迁移</h3>
        <p>将旧版绘图器存档转换为新版的</p>
    </div>
    <h2>中期规划</h2>
    <div>
        <h3>多人协作</h3>
        <p>支持多个用户同时编辑一张画布，任何操作都会立即同步给其他用户</p>
    </div>
    <div>
        <h3>丰富线路样式</h3>
        <p>虚线和不同宽度的多层描边</p>
    </div>
    <div>
        <h3>区间标记</h3>
        <p>高架、单向运行、施工中、规划中</p>
    </div>
    <div>
        <h3>出站换乘标记</h3>
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
        <h3>客流量模拟计算</h3>
        <p>设置城市地图各处的住宅/消费/岗位密度，模拟并可视化各线路/区间的客流量</p>
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
    欢迎对<a href="https://gitee.com/au114514/aarc" target="_blank">本项目源码</a>做出改进贡献。
</div>
</template>

<style scoped lang="scss">
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