<script setup lang="ts">

</script>

<template>
<div class="app-tools">
    <div class="problem-notice">如使用遇到问题，请联系工具的作者</div>
    <div class="tool-item">
        <a href="http://wiki.jowei19.com/#/w/RMP-zhuan-AARC-zhuan-huan-qi" target="_blank"
            class="tool-entry" style="background: linear-gradient(to right, gray 30%, #33BDB6);">
            RMP-AARC转换器
        </a>
        <div class="author-name">
            作者：滨蜀
        </div>
    </div>
    <div class="tool-item">
        <a href="http://wiki.jowei19.com/#/w/bsdazmdcq" target="_blank"
            class="tool-entry" style="background: linear-gradient(to right, #33BDB6, #0271BD);">
            AARC-FicCloud转换器
        </a>
        <div class="author-name">
            作者：滨蜀
        </div>
    </div>
    <div class="tool-item">
        <a href="http://railchess.jowei19.com/#/aarcConverter" target="_blank"
            class="tool-entry" style="background: linear-gradient(to right, #33BDB6, #8F98F2);">
            AARC-轨交棋转换器
        </a>
        <div class="author-name">
            作者：SlinkierApple13
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.app-tools{
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding-top: 30px;
    .problem-notice{
        text-align: center;
        color: #666;
    }
    .tool-item{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        .tool-entry{
            display: block;
            text-align: center;
            padding: 6px;
            width: 80vw;
            max-width: 300px;
            color: white;
            border-radius: 10px;
            &:hover{
                transform: scale(1.05);
                box-shadow: 0px 4px 6px 0px #00000088;
                text-decoration: none;
            }
        }
        .author-name{
            color: #666;
            font-size: 14px;
        }
    }
}
</style>