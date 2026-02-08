<script lang="ts" setup>
const footerLinkLeft = import.meta.env.VITE_FooterLinkLeft
const footerLinkRight = import.meta.env.VITE_FooterLinkRight
</script>

<template>
    <div class="footer">
        <div v-html="footerLinkLeft"></div>
        <div v-html="footerLinkRight"></div>
    </div>
</template>

<style lang="scss" scoped>
.footer{
    height: 40px;
    padding-top: 20px;
    width: 100%;
    background-color: white;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    &>div{
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
    }
    & :nth-child(1){
        justify-content: flex-start;
        flex-shrink: 0;
    }
    & :nth-child(2){
        justify-content: flex-end;
    }
}
</style>
<style lang="scss">
.footer {
    a{
        font-size: 14px;
        color: #aaa;
        text-decoration: none;
        &:hover {
            color: cornflowerblue;
            text-decoration: underline;
        }
    }
}
</style>