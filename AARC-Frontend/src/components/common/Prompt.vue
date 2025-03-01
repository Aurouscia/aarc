<template>
    <div class="prompt fixFill">
        <div class="background fixFill"></div>
        <div class="panel">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.prompt{
    z-index: 20000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.fixFill{
    position: fixed;
    inset: 0px;
}
.background{
    background-color: black;
    opacity: 0.2;
}
.panel{
    border-radius: 10px;
    box-shadow: 0 0 10px 0 black;
    background-color: white;
    padding: 20px;
    z-index: 20001;
}
</style>