<script setup lang="ts">
import { ref, CSSProperties, computed, watch, nextTick } from 'vue';
import SideBar from '../common/SideBar.vue';
import { Line } from '@/models/save';
import Switch from '@/components/common/Switch.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import ColorPickerForLine from './shared/ColorPickerForLine.vue';
import { usePaletteLocalConfigStore } from '@/app/localConfig/paletteConfig';
import { storeToRefs } from 'pinia';
import { removeAllByPred } from '@/utils/lang/indicesInArray';
import { keepOrderSort } from '@/utils/lang/keepOrderSort';

const envStore = useEnvStore()
const colorProcStore = useColorProcStore()
const sidebar = ref<InstanceType<typeof SideBar>>()
const props = defineProps<{
    editingLine: Line
}>()

const colorSetsProm = import('@/data/palette/colorSets')
type ColorSet = (Awaited<typeof colorSetsProm>)['default'][number]
interface ColorSetItem {
    name: string
    subname?: string
    isUnofficial: boolean
    color: string
    colorInv: string
}
type ColorSetExtended = ColorSet & {
    showing?:boolean, 
    items?: ColorSetItem[],
    keywords?: string,
    isFictional?: boolean
}

const cs = ref<ColorSetExtended[]>()
colorSetsProm.then(x => {
    //模块加载完成：赋值给cs
    cs.value = x.default
    //初始化“搜索关键词”和“是否架空”，其中“搜索关键词”特别注意性能
    const EMPTY = new Set([' ', '\t', '\n']);
    cs.value.forEach(s=>{
        s.isFictional = s.pri >= 500 //pri大于500的是架空颜色集
        if (s.data) {
            const len = s.data.length;
            let i = 0;
            // ② 快速跳过空白
            while (i < len && EMPTY.has(s.data[i])) 
                ++i;
            if (i < len) {                              // 找到了非空白
                let nl = s.data.indexOf('\n', i);           // 第一个换行
                if (nl === -1) 
                    nl = len;                               // 可能没换行
                s.keywords = s.data.slice(i, nl).trim();    // slice出这一段
            }
            else 
                s.keywords = '#';                       // 全是空白
        }
    })
    ensureSetsOrdered()
})

const searchFilter = ref('')
const csFiltered = computed<ColorSetExtended[]>(()=>{
    const filterStrLower = searchFilter.value.toLocaleLowerCase()
    if(!filterStrLower || !cs.value)
        return cs.value ?? []
    return cs.value.filter(c => c.keywords?.includes(filterStrLower)) ?? []
})

function toggleSetShowing(colorSet:ColorSetExtended){
    if(colorSet.showing){
        colorSet.showing = false
    }else{
        colorSet.showing = true
        if(!colorSet.items){
            colorSet.items = parseColorSetData(colorSet.data)
        }
    }
}

const parenthesisAndContent = /\([^)]*\)/
const parenthesisContent = /(?<=\()[^)]*(?=\))/
function parseColorSetData(data: string){
    let res: ColorSetItem[] = []
    //去除(首尾)可能存在的空行
    let rows = data.split('\n').filter(x=>!!x) 
    //第一行是搜索词，所以从第二行开始收集颜色
    for(let i = 1; i<rows.length; i++){
        const row = rows.at(i)?.trim()
        if(!row)
            continue
        let [name, color] = row.split(':')
        if (name && color) {
            let isUnofficial = false
            if(name.includes('*')){
                isUnofficial = true
                name = name.replace('*', '')
            }
            const nameMain = name.replace(parenthesisAndContent, '')
            const nameSub = name.match(parenthesisContent)?.at(0)
            const colorInv = colorProcStore.colorProcInvBinary.convertNoCache(color)
            res.push({
                name: nameMain,
                subname: nameSub,
                isUnofficial,
                color,
                colorInv
            })
        }
    }
    return res
}

const { 
    strictMode, subnameMode, favoriteNames 
} = storeToRefs(usePaletteLocalConfigStore())
const fav = computed<Set<string>>(()=>new Set(favoriteNames.value)) 
function isFavorite(cs:ColorSet|string){
    const name = typeof cs =='string' ? cs : cs.name.trim()
    return fav.value.has(name)
}
function toggleFavorite(cs:ColorSetExtended){
    const name = cs.name.trim()
    if(isFavorite(name)){
        removeAllByPred<string>(favoriteNames.value, x => x == name)
        cs.showing = false
    }
    else
        favoriteNames.value.push(name)
    ensureSetsOrdered()
}
function ensureSetsOrdered(){
    if(!cs.value) return
    keepOrderSort(cs.value, (a, b)=>{
        let aNum = isFavorite(a) ? 1 : 0
        let bNum = isFavorite(b) ? 1 : 0
        if(aNum != bNum)
            return bNum - aNum  //先按“是否顶置”排序
        return a.pri - b.pri    //再按pri排序
    })
}

const picker = ref<InstanceType<typeof ColorPickerForLine>>()
const showPicker = ref(true)
function closePickers() {
    picker.value?.close()
}
const pickerEntryStyles: CSSProperties = {
    width: '200px', height: '26px'
}
function chooseColor(color: string) {
    props.editingLine.color = color
    envStore.rerender()
    picker.value?.enforceTo(color)
    emit('colorUpdated')
}
watch(()=>props.editingLine.id, ()=>{
    //刷新一次颜色选择器（强制重新生成）
    showPicker.value = false
    nextTick(()=>{
        showPicker.value = true
    })
})

defineExpose({
    open: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})
const emit = defineEmits<{
    (e: 'colorUpdated'): void
}>()
</script>

<template>
<SideBar ref="sidebar" @click="closePickers" :shrink-way="'v-show'">
    <div class="palette">
        <div class="topArea">
            <div class="paletteTitle">
                <b>颜色库</b>
                <div class="switches">
                    <Switch :left-text="'宽松'" :right-text="'严格'" :initial="strictMode?'right':'left'" 
                        @left="strictMode = false" @right="strictMode = true"></Switch>
                    <Switch :left-text="'主名'" :right-text="'副名'" :initial="subnameMode?'right':'left'"
                        @left="subnameMode = false" @right="subnameMode = true"></Switch>
                </div>
            </div>
            <div class="lineName" :style="{color: editingLine.color}">
                {{ editingLine.name ?? '未命名线路' }}
            </div>
            <ColorPickerForLine v-if="showPicker" ref="picker" :line="editingLine"
                :entry-styles="pickerEntryStyles" @color-updated="emit('colorUpdated')"></ColorPickerForLine> 
            <input v-model="searchFilter" placeholder="搜索颜色集">
        </div>
        <div class="bodyArea">
            <div v-for="cs in csFiltered" class="colorSet" :key="cs.name">
                <h3 @click="toggleSetShowing(cs)" :class="{showing: cs.showing}">
                    {{ cs.isFictional ? '*':'' }}{{ cs.name }}
                    <button v-if="cs.showing || isFavorite(cs)" @click.stop="toggleFavorite(cs)" class="lite">
                        {{ isFavorite(cs) ? '已顶置':'顶置' }}
                    </button>
                </h3>
                <div v-if="cs.showing" class="colorItems">
                    <template v-for="item in cs.items" :key="item.name">
                        <button v-if="!strictMode || !item.isUnofficial"
                            :style="{ backgroundColor: item.color, color: item.colorInv }"
                            class="colorItem" @click="chooseColor(item.color)">
                            {{ subnameMode && item.subname ? item.subname : item.name }} 
                        </button>
                    </template>
                </div>
            </div>
            <div class="tail">
                <button v-if="searchFilter" class="lite" @click="searchFilter=''">
                    清空搜索
                </button>
                <a v-else href="http://wiki.jowei19.com/#/w/yan-se-ku-geng-xin-ri-zhi" target="_blank">
                    更新日志
                </a>
            </div>
        </div>
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.palette{
    display: flex;
    flex-direction: column;
    height: 100%;
    .topArea{
        flex-grow: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin-top: 40px;
        padding-bottom: 6px;
        .paletteTitle{
            position: absolute;
            top: 0px;
            left: 0px;
            right: 0px;
            height: 40px;
            padding: 0px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0px 0px 5px 0px black;
            b{
                font-size: 18px;
                color: #666;
            }
            .switches{
                display: flex;
                gap: 5px;
            }
        }
        .lineName{
            font-weight: bold;
            font-size: 18px;
            user-select: none;
        }
        input{
            margin: 0px;
        }
    }
    .bodyArea {
        flex-grow: 1;
        overflow-y: scroll;
        h3 {
            position: relative;
            padding: 4px 0px;
            font-weight: 400;
            text-align: center;
            cursor: pointer;
            color: #666;
            user-select: none;
            &:hover{
                background-color: #eee;
            }
            button{
                font-size: 14px;
                position: absolute;
                right: 2px;
                bottom: 5px;
            }
        }
        h3.showing {
            font-weight: bold;
            color: #222;
        }
        .colorItems{
            padding-bottom: 6px;
        }
        .colorItem {
            font-size: 16px;
            height: 24px;
            line-height: 24px;
            padding: 0px 4px;
            margin: 3px;
            min-width: 22px;
            transition: 0.3s;
            &:hover{
                box-shadow: 0px 0px 6px 0px #999;
            }
        }
        .tail{
            margin-top: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    }
}
</style>