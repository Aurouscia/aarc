<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { useIconStore } from '@/models/stores/iconStore';

const iconStore = useIconStore()
const { ensureAllLoaded, ensurePrefixSelectedValid } = iconStore
const { prefixes, prefixSelected, prefixedIcons } = storeToRefs(iconStore)

const ok = ref(false)
onMounted(async()=>{
    await ensureAllLoaded()
    ensurePrefixSelectedValid()
    ok.value = true
})
</script>

<template>
<ConfigSection :title="'文本标签图标(制作中)'">
    <div v-if="ok" class="ttIconConfig">
        <div class="ttIconPrefixSelect">
            组
            <select v-model="prefixSelected">
                <option v-for="p in prefixes" :value="p">{{ p }}</option>
            </select>
        </div>
        <div class="prefixedIconList">
            <div v-for="item in prefixedIcons" :key="item.i.id">
                <div class="prefixedIconImgAndWidth">
                    <div class="prefixedIconKV">
                        宽度<input v-model.number="item.i.width" style="width: 90px;" :min="10" :max="1000" :step="10"/>
                    </div>
                    <img v-if="item.data?.img?.src"
                        :src="item.data?.img?.src"/>
                    <div v-else class="prefixedIconErrmsg">
                        {{ item.data?.errmsg ?? '未知错误' }}
                    </div>
                </div>
                <div class="prefixedIconKV">
                    名称<input v-model.lazy="item.i.name" @blur="ensurePrefixSelectedValid"/>
                </div>
                <div class="prefixedIconKV">
                    链接<input v-model="item.i.url" style="font-size: 12px;" @blur="ensureAllLoaded"/>
                </div>
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
    background-color: #eee;
    width: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2px;
    padding: 6px;
    font-size: 18px;
    select{
        min-width: 100px;
        max-width: 200px;
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
}
</style>