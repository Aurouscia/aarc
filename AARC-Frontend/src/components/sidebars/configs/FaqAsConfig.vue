<script setup lang="ts">
import ConfigSection from './shared/ConfigSection.vue';
</script>

<template>
<ConfigSection :title="'常见问题'" :special="true">
<div class="faqs">
    <div>
        <h3>怎么避免卡顿</h3>
        <div>
            <p>你应该：干净利落地移动/缩放视角，并在两次移动/缩放间留出稍长的空隙。</p>
            <p>卡顿是由于js的单线程性质造成的，无法根治，但如果操作者能与工具紧密配合，就能避免发生卡顿。</p>
            <p>本绘图器会在你做出任何操作（包括编辑/缩放视角/移动视角）并停止的约0.1秒后进行重新渲染。</p>
            <p>根据画布内容的多少，重新渲染可能耗时0.01~0.15秒左右。</p>
            <p>如果这时候，你正好试图进行视角移动，就会发生卡顿。</p>
            <p>反之，如果你等待约0.1~0.25秒（可以注意到画布被重新填满屏幕/变清晰）后，再次进行操作，即可避免与重新渲染事件“撞上”。</p>
        </div>
    </div>
    <div>
        <h3>怎么控制线路走向</h3>
        <div>
            <p>请点击首页的紫色“查看使用说明”链接，并跟随里面的引导。</p>
        </div>
    </div>
    <div>
        <h3>车站团的形状</h3>
        <div>
            <p>当几个车站互相靠近吸附时，就会形成一个车站团覆盖它们。</p>
            <p>车站团必然是矩形，但可能是“正的”或“斜的”。</p>
            <p>当车站团内所有站朝向一致时，会使用该朝向。</p>
            <p>当车站团内并不朝向一致时，会使用正/斜中“面积最小的画法”。</p>
            <p>如果希望巨型车站结构更清晰，请拆分为多个车站团，并使用车站连线连接。</p>
        </div>
    </div>
    <div>
        <h3>拉远时站名变成方块</h3>
        <div>
            <p>请进入同页面的“编辑器”设置，查看“站名糊弄机制”。</p>
            <p>在站名较多时，这将显著提高性能，建议设为“宽松”。</p>
        </div>
    </div>
    <div>
        <h3>缩放时背景图尺寸不固定</h3>
        <div>
            <p>请在背景图链接下方的输入框中设置其宽或高。</p>
        </div>
    </div>
    <div>
        <h3>有任何用着不爽的地方</h3>
        <div>
            <p>请加首页的qq群联系群主反映</p>
        </div>
    </div>
</div>
</ConfigSection>
</template>

<style lang="scss" scoped>
.faqs{
    display: flex;
    flex-direction: column;
    gap: 10px;
    &>div{
        background-color: #eee;
        padding: 5px;
        border-radius: 5px;
    }
}
h3{
    margin-bottom: 8px;
}
p{
    margin-bottom: 5px;
    font-size: 14px;
    text-indent: 2em;
}
</style>