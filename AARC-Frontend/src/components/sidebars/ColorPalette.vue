<script setup lang="ts">
import colorSets from '@/data/palette/colorSets'
import { ref, CSSProperties, computed } from 'vue';
import SideBar from '../common/SideBar.vue';
import { Line } from '@/models/save';
import Switch from '@/components/common/Switch.vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { useEnvStore } from '@/models/stores/envStore';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";

const envStore = useEnvStore()
const colorProcStore = useColorProcStore()
const cs = colorSets

const sidebar = ref<InstanceType<typeof SideBar>>()

const props = defineProps<{
    editingLine: Line
}>()
const haveParent = computed(() => !!props.editingLine.parent)
const picker0 = ref<InstanceType<typeof AuColorPicker>>()
function closePickers() {
    picker0.value?.closePanel()
}

interface CityLine {
    name: string;
    subname: string;
    isUnofficial: boolean;
    color: string;
}
const searchFilter = ref('')
const filtered = computed(()=>{
    const filterStrLower = searchFilter.value.toLocaleLowerCase()
    return cs.filter(c => (!searchFilter) || getCityName(c.data).includes(filterStrLower))
})

const openedCities = ref<number[]>([])
function openCity(cityid: number) {
    if(openedCities.value.includes(cityid)){
        openedCities.value=openedCities.value.filter(x=>x!=cityid)
    }
    else{
        openedCities.value.push(cityid)
    }
}
function closeAll() {
    openedCities.value = []
}

const regexp = /\(([^{}]+)\)/g
function removeParenthesesContent(str: string) {
    return str.replace(regexp, '').trim();
}
function getParenthesesContent(str: string) {
    let matched = str.match(regexp)
    if (!matched) {
        return ''
    }
    return matched[0].replace('(', '').replace(')', '')
}
function parseCity(data: string) {
    let lines: CityLine[] = []
    let splitted = data.split('\n').filter(x => x != '').slice(1)
    splitted.forEach(l => {
        let lSplitted = l.split(':')
        let name = lSplitted[0]
        let color = lSplitted[1]
        if (color) {
            lines.push({
                name: removeParenthesesContent(name.replace('*', '')),
                subname: getParenthesesContent(name.replace('*', '')),
                isUnofficial: name.includes('*'),
                color: color
            })
        }
    })
    return lines
}
let viewUnofficialColors = ref(true)
let viewSubnames = ref(false)
const pickerEntryStyles: CSSProperties = {
    width: '240px', height: '14px'
}
function getCityName(data: string) {
    let res = data.match(/\n([^\n]*)\n/)
    if (!res) { return '' }
    return res[0]
}

function setColor(color: string) {
    props.editingLine.color = color
    envStore.rerender([], [])
    picker0.value?.enforceTo(color)
}

defineExpose({
    open: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})

const emit = defineEmits<{
    (e: 'colorUpdated'): void
}>()
</script>

<template>
<SideBar ref="sidebar" @click="closePickers" @fold="closeAll()">
    <div class="palette">
        <div class="topArea">
            <div class="paletteTitle">
                <b>颜色库</b>
                <div class="switches">
                    <Switch :left-text="'标准'" :right-text="'严谨'" :initial="'left'" @left="viewUnofficialColors = true"
                        @right="viewUnofficialColors = false"></Switch>
                    <Switch :left-text="'主名'" :right-text="'副名'" :initial="'left'" @left="viewSubnames = false"
                        @right="viewSubnames = true"></Switch>
                </div>
            </div>
            <template v-if="!haveParent">
                <AuColorPicker :initial="props.editingLine.color"
                    @done="c => { props.editingLine.color = c; emit('colorUpdated'); envStore.lineInfoChanged(props.editingLine) }"
                    ref="picker0" :panel-base-z-index="10000" :show-package-name="false" :entry-respond-delay="1"
                    :panel-click-stop-propagation="true" :entry-styles="pickerEntryStyles"></AuColorPicker>
            </template>
            <input v-model="searchFilter" placeholder="搜索颜色集">
        </div>
        <div class="bodyArea">
            <div v-for="city in filtered">
                <h3 @click="openCity(city.pri)" class="city">
                    <span v-if="openedCities.includes(city.pri)" class="opened"><span v-if="city.pri > 499">*</span>{{
                        city.name
                        }}</span>
                    <span v-else class="closed"><span v-if="city.pri > 499">*</span>{{ city.name }}</span>
                </h3>
                <div v-if="openedCities.includes(city.pri)">
                    <span v-for="line in parseCity(city.data)">
                        <button v-if="viewUnofficialColors || !line.isUnofficial"
                            :style="{ backgroundColor: line.color, color: colorProcStore.colorProcInvBinary.convert(line.color) }"
                            class="colorItem" @click="setColor(line.color)">
                            <span v-if="viewSubnames && line.subname != ''">
                                {{ line.subname }}
                            </span>
                            <span v-else>
                                {{ line.name }}
                            </span>
                        </button>
                    </span>
                </div>
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
        gap: 10px;
        .paletteTitle{
            align-self: stretch;
            display: flex;
            justify-content: space-between;
            align-items: center;
            b{
                font-size: 18px;
                color: #666;
            }
            .switches{
                display: flex;
                gap: 5px;
            }
        }
    }
    .bodyArea {
        flex-grow: 1;
        overflow-y: scroll;
        h3 {
            text-align: center;
            cursor: pointer;
        }
        .colorItem {
            font-size: small;
            padding: 2px;
        }
    }
}
.opened {
    color: #222;
}
.closed {
    color: #777;
}
</style>