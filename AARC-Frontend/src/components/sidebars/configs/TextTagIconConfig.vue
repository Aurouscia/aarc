<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useIconStore } from '@/models/stores/iconStore';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { TextTagIcon } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';

const saveStore = useSaveStore()
const iconStore = useIconStore()
const mainCvs = useMainCvsDispatcher()
const rr = ()=>mainCvs.renderMainCvs({})
const { ensureAllLoaded, ensurePrefixSelectedValid, enforcePrefixSelectedTo } = iconStore
const { prefixes, prefixSelected, prefixedIcons } = storeToRefs(iconStore)

const hideImgs = ref(false)
const creatingIcon = ref<TextTagIcon>({id:0})
const createAllowed = computed<boolean>(()=>{
    const i = creatingIcon.value
    return !!i.name && !!i.url
})
async function createIcon(){
    const i = creatingIcon.value
    if(!createAllowed.value || !saveStore.save)
        return
    i.id = saveStore.getNewId()
    i.width = 50
    saveStore.save.textTagIcons ??= []
    saveStore.save.textTagIcons.push(i)
    creatingIcon.value = {id:0}
    hideImgs.value = true
    await ensureAllLoaded()
    await nextTick()
    enforcePrefixSelectedTo(i.id)
    hideImgs.value = false
}

async function urlInputBlurHandler(){
    const triedIds = await ensureAllLoaded()
    rerenderIfNeeded(triedIds)
}
async function rerenderIfNeeded(iconIds:number[]) {
    if(iconIds.length>0){
        const usedIcons = saveStore.save?.textTags.map(x=>x.icon) ?? []
        if(iconIds.some(id=>usedIcons.includes(id))){
            rr()
        }
    }
}

const ok = ref(false)
onMounted(async()=>{
    await ensureAllLoaded()
    ensurePrefixSelectedValid()
    ok.value = true
})
</script>

<template>
<ConfigSection :title="'文本标签图标'">
    <div v-if="ok" class="ttIconConfig">
        <div class="ttIconPrefixSelect">
            图标组
            <select v-model="prefixSelected">
                <option v-for="p in prefixes" :value="p">{{ p }}</option>
            </select>
        </div>
        <div class="prefixedIconList">
            <div v-for="item in prefixedIcons" :key="item.i.id">
                <div class="prefixedIconImgAndWidth">
                    <div class="prefixedIconKV">
                        宽度<input v-model.number="item.i.width" style="width: 90px;" :min="10" :max="1000" :step="10"
                            @blur="rerenderIfNeeded([item.i.id])"/>
                    </div>
                    <img v-if="!hideImgs && item.data?.img?.src"
                        :src="item.data?.img?.src"/>
                    <div v-else class="prefixedIconErrmsg">
                        {{ item.data?.errmsg ?? '未知错误' }}
                    </div>
                </div>
                <div class="prefixedIconKV">
                    名称<input v-model.lazy="item.i.name" @blur="enforcePrefixSelectedTo(item.i.id)"/>
                </div>
                <div class="prefixedIconKV">
                    链接<input v-model="item.i.url" style="font-size: 12px;" @blur="urlInputBlurHandler"/>
                </div>
            </div>
            <div class="newIcon">
                <div>添加自定义图标</div>
                <div class="prefixedIconKV">
                    名称<input v-model="creatingIcon.name" :placeholder="'组名-图标名'"/>
                </div>
                <div class="prefixedIconKV">
                    链接<input v-model="creatingIcon.url" style="font-size: 12px;"/>
                </div>
                <button @click="createIcon" :class="createAllowed ? 'ok':'off'">添加</button>
            </div>
        </div>
    </div>
    <div v-else>加载图标文件中，请稍后</div>
</ConfigSection>
</template>

<style scoped lang="scss">
.ttIconConfig{
    display: flex;
    flex-direction: column;
    align-items: stretch;
}
.ttIconPrefixSelect{
    background-color: cornflowerblue;
    color: white;
    align-self: stretch;
    width: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2px;
    padding: 10px;
    font-size: 18px;
    select{
        min-width: 100px;
        max-width: 180px;
        margin: 0px;
    }
}
.prefixedIconList{
    background-color: #eee;
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    &>div{
        display: flex;
        align-items: center;
        flex-direction: column;
        border: 2px solid #666;
        padding: 4px;
        border-radius: 10px;
        .prefixedIconImgAndWidth{
            align-self: stretch;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            .prefixedIconErrmsg{
                color: red;
                align-self: center;
                font-size: 13px;
            }
        }
        .prefixedIconKV{
            display: flex;
            align-items: center;
        }
        img{
            width: 40px;
            height: 40px;
            margin: 5px;
            object-fit: contain;
        }
    }
    .newIcon{
        border-color: #aaa;
        input::placeholder{
            color: #bbb;
        }
    }
}
</style>