<script setup lang="ts">
import { ref, CSSProperties, computed, watch, nextTick, useTemplateRef } from 'vue';
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
const sidebar = useTemplateRef('sidebar')
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
    showing?: boolean,
    items?: ColorSetItem[],
    keywords?: string,
    isFictional?: boolean,
}

const cs = ref<ColorSetExtended[]>()

// ── localStorage key ──────────────────────────────────────────────────────────
const LS_KEY = 'bsapi_colorsets_cache'

// ── API ───────────────────────────────────────────────────────────────────────
const COLOR_SET_VERSIONED_API =
    'http://binshu.jowei19.com/api/filecontents/versioned?path=colorsets&recursive=true'

interface VersionedResponse {
    version: number
    content: { filename: string; content: string }[]
}
interface LocalCache {
    version: number
    content: { filename: string; content: string }[]
}

// ── 解析 filename（格式：[pri-]name）→ { pri, name } ──────────────────────────
function parseFilename(filename: string): { pri: number; name: string } {
    const dashIdx = filename.indexOf('-')
    if (dashIdx < 0) return { pri: 0, name: filename }
    const idStr = filename.slice(0, dashIdx)
    const pri = parseInt(idStr, 10)
    return isNaN(pri)
        ? { pri: 0, name: filename }
        : { pri, name: filename.slice(dashIdx + 1) }
}

// ── 将 [{filename, content}] 转成 ColorSetExtended[] ────────────────────────
function buildCsFromRaw(raw: { filename: string; content: string }[]): ColorSetExtended[] {
    return raw.map(({ filename, content }) => {
        const { pri, name } = parseFilename(filename)
        return { name, pri, data: content } as ColorSetExtended
    })
}

// ── 初始化 keywords / isFictional ────────────────────────────────────────────
function initKeywords(sets: ColorSetExtended[]) {
    const EMPTY = new Set([' ', '\t', '\n'])
    sets.forEach(s => {
        s.isFictional = s.pri >= 500
        if (s.data) {
            const len = s.data.length
            let i = 0
            while (i < len && EMPTY.has(s.data[i])) ++i
            if (i < len) {
                let nl = s.data.indexOf('\n', i)
                if (nl === -1) nl = len
                s.keywords = s.data.slice(i, nl).trim()
            } else {
                s.keywords = '#'
            }
        }
    })
}

// ── 主入口 ────────────────────────────────────────────────────────────────────
async function initColorSets() {
    // 1. 读 localStorage 里存的版本号，没有则默认 0
    let cachedVersion = 0
    let cachedData: LocalCache | null = null
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (raw) {
            cachedData = JSON.parse(raw) as LocalCache
            cachedVersion = cachedData.version ?? 0
        }
    } catch {
        // 解析失败，当作没有缓存
    }

    // 2. 尝试从 API 拉取（带版本号，让服务器决定是否返回数据）
    let fetchedFromApi = false
    try {
        const url = `${COLOR_SET_VERSIONED_API}&clientVersion=${cachedVersion}`
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (resp.ok) {
            const body = await resp.text()
            // 服务器版本 >= cachedVersion → 返回空字符串，不需要更新
            if (body === '""' || body.trim() === '""' || body.trim() === '') {
                // 版本未落后，不更新，走缓存
            } else {
                const data: VersionedResponse = JSON.parse(body)
                // 存入 localStorage
                const toStore: LocalCache = { version: data.version, content: data.content }
                try { localStorage.setItem(LS_KEY, JSON.stringify(toStore)) } catch { /* 存储失败忽略 */ }
                cachedData = toStore
                cachedVersion = data.version
                fetchedFromApi = true
            }
        }
    } catch {
        // 网络不通或超时，静默 fallback
    }

    // 3. 用 localStorage 里的数据渲染
    if (cachedData?.content?.length) {
        cs.value = buildCsFromRaw(cachedData.content)
        initKeywords(cs.value)
        ensureSetsOrdered()
        return
    }

    // 4. 最终兜底：项目内置静态数据
    const x = await colorSetsProm
    cs.value = x.default as ColorSetExtended[]
    initKeywords(cs.value)
    ensureSetsOrdered()
}

initColorSets()

// ── 展开/收起（数据已全量加载，只需解析 items）────────────────────────────────
function toggleSetShowing(colorSet: ColorSetExtended) {
    if (colorSet.showing) {
        colorSet.showing = false
        return
    }
    if (!colorSet.items && colorSet.data) {
        colorSet.items = parseColorSetData(colorSet.data)
    }
    colorSet.showing = true
}

// ── 搜索 ─────────────────────────────────────────────────────────────────────
const searchFilter = ref('')
const csFiltered = computed<ColorSetExtended[]>(() => {
    const filterStrLower = searchFilter.value.toLocaleLowerCase()
    if (!filterStrLower || !cs.value) return cs.value ?? []
    return cs.value.filter(c => c.keywords?.includes(filterStrLower)) ?? []
})

// ── 解析颜色集文本 ────────────────────────────────────────────────────────────
const parenthesisAndContent = /\([^\(\)]*(?:\([^\(\)]*\)[^\(\)]*)*\)/
const parenthesisContent = /(?<=\().*(?=\))/
function parseColorSetData(data: string): ColorSetItem[] {
    const res: ColorSetItem[] = []
    const rows = data.split('\n').filter(x => !!x)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]?.trim()
        if (!row) continue
        let [name, color] = row.split(':')
        if (name && color) {
            let isUnofficial = false
            if (name.includes('*')) {
                isUnofficial = true
                name = name.replace('*', '')
            }
            const nameMain = name.replace(parenthesisAndContent, '')
            const nameSub = name.match(parenthesisContent)?.at(0)
            const colorInv = colorProcStore.colorProcInvBinary.convertNoCache(color)
            res.push({ name: nameMain, subname: nameSub, isUnofficial, color, colorInv })
        }
    }
    return res
}

// ── 收藏 / 排序 ───────────────────────────────────────────────────────────────
const { strictMode, subnameMode, favoriteNames } = storeToRefs(usePaletteLocalConfigStore())
const fav = computed<Set<string>>(() => new Set(favoriteNames.value))
function isFavorite(cs: ColorSet | string) {
    const name = typeof cs == 'string' ? cs : cs.name.trim()
    return fav.value.has(name)
}
function toggleFavorite(cs: ColorSetExtended) {
    const name = cs.name.trim()
    if (isFavorite(name)) {
        removeAllByPred<string>(favoriteNames.value, x => x == name)
        cs.showing = false
    } else {
        favoriteNames.value.push(name)
    }
    ensureSetsOrdered()
}
function ensureSetsOrdered() {
    if (!cs.value) return
    keepOrderSort(cs.value, (a, b) => {
        const aFav = isFavorite(a) ? 1 : 0
        const bFav = isFavorite(b) ? 1 : 0
        if (aFav !== bFav) return bFav - aFav
        return a.pri - b.pri
    })
}

// ── 取色器 ────────────────────────────────────────────────────────────────────
const picker = useTemplateRef('picker')
const showPicker = ref(true)
function closePickers() { picker.value?.close() }
const pickerEntryStyles: CSSProperties = { width: '200px', height: '26px' }
function chooseColor(color: string) {
    props.editingLine.color = color
    envStore.lineInfoChanged(props.editingLine)
    envStore.rerender()
    picker.value?.enforceTo(color)
    emit('colorUpdated')
}
watch(() => props.editingLine.id, () => {
    showPicker.value = false
    nextTick(() => { showPicker.value = true })
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