<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TopbarModel } from '@/app/topbar/topbarModel';
import { getTopbarData } from '@/app/topbar/topbarData';
import itemsImg from '@/assets/ui/items.svg';
import aarcLogo from '@/assets/logo/aarc-new.svg'
import defaultAvatar from '@/assets/defaultAvatar.svg'
import TopbarBodyHorizontal from './TopbarBodyHorizontal.vue';
import TopbarBodyVertical from './TopbarBodyVertical.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useSavesRoutesJump } from '@/pages/saves/routes/routesJump';

const topbarModel = ref<TopbarModel>();
const { userInfo } = storeToRefs(useUserInfoStore())
const router = useRouter();
const { mySavesRoute } = useSavesRoutesJump()
onMounted(async()=>{
    topbarModel.value = await getTopbarData();
})

const topbarBodyVert = ref<InstanceType<typeof TopbarBodyVertical>>();
function toggleFold(){
    topbarBodyVert.value?.toggleFold();
}
</script>

<template>
<div class="topbarParent">
    <div class="logo" @click="router.push('/')">
        <img :src="aarcLogo" alt="aarcLogo" />
        <div class="logoText">
            <div class="logoText1">AARC</div>
            <div class="logoText2">线路图画布</div>
        </div>
    </div>
    <div v-if="topbarModel" class="topbarHori">
        <TopbarBodyHorizontal :data="topbarModel"></TopbarBodyHorizontal>
    </div>
    <div class="right">
        <RouterLink v-if="!!userInfo?.id" :to="mySavesRoute()" class="avt">
            <img :src="defaultAvatar"/>
        </RouterLink>
        <div class="foldBtn">
            <img :src="itemsImg" @click="toggleFold"/>
        </div>
    </div>
</div>
<div class="topbarParentShadow"></div>
<div v-if="topbarModel" class="topbarVert">
    <TopbarBodyVertical :data="topbarModel" ref="topbarBodyVert"></TopbarBodyVertical>
</div>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';

$topbar-logo-area-width : 110px;

.notifExists{
    position: absolute;
    top:-1px;right: -1px;
}
.logo{
    width: $topbar-logo-area-width;
    height: 42px;
    position: absolute;
    left: 10px;
    display: flex;
    align-items: center;
    gap:5px;
    cursor: pointer;
    img{
        object-fit: contain;
        height: 40px;
        width: 40px;
    }
    .logoText{
        flex-grow: 1;
        margin-right: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        gap: 0px;
        color: #333;
        .logoText1{
            font-size: 18px;
            height: 23px;
        }
        .logoText2{
            font-size: 10px;
        }
    }
}

.topbarParent{
    position: fixed;
    top: 0px;
    left: 0px;
    right: 0px;
    height: globalValues.$topbar-height;;
    z-index: 1000;
    display: flex;
    justify-content: left;
    align-items: center;
    background-color: white;
}
.topbarParentShadow{
    position: fixed;
    top: 0px;
    left: 0px;
    right: 0px;
    height: globalValues.$topbar-height;;
    z-index: 900;
    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.7);
}

.right{
    position: absolute;
    right: 10px;
    display: flex;
    justify-content: right;
    gap: 7px;
    align-items: center;
    .avt{
        img{
            width: 35px;
            height: 35px;
            border-radius: 1000px;
            object-fit: contain;
        }
    }
    .foldBtn{
        height: 25px;
        width: 25px;
        padding: 5px;
        border-radius: 1000px;
        background-color: #eee;
        cursor: pointer;
        position: relative;
        img{
            width: 25px;
            height: 25px;
            object-fit: contain;
        }
    }
    img{
        cursor: pointer;
    }
}

.topbarHori{
    display: none;
    margin-left: calc($topbar-logo-area-width + 10px);
}
@media screen and (min-width: 500px){
    .foldBtn{
        display: none;
    }
    .topbarHori{
        display: block;
    }
    .topbarVert{
        display: none;
    }
}
</style>