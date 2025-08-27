<script setup lang="ts">
import { real } from '@/data/palette/palette'
import { ref, CSSProperties, computed } from 'vue';
import SideBar from '../common/SideBar.vue';
import { Line } from '@/models/save';
import Switch from '@/components/common/Switch.vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { useEnvStore } from '@/models/stores/envStore';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";

const envStore = useEnvStore()
const colorProcStore = useColorProcStore()

const sidebar = ref<InstanceType<typeof SideBar>>()

const props = defineProps<{
    editingLine: Line
}>()
const haveParent = computed(() => !!props.editingLine.parent)
const picker0 = ref<InstanceType<typeof AuColorPicker>>()
function closePickers() {
    picker0.value?.closePanel()
}
defineExpose({
    open: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})

const emit = defineEmits<{
    (e: 'colorUpdated'): void
}>()

interface CityLine {
    name: string;
    subname: string;
    isUnofficial: boolean;
    color: string;
}
const searchFilter = ref('')
const regexp = /\(([^{}]+)\)/g
//处理real
function openCity(cityid: number) {
    let city = real.find(x => x.pri == cityid)
    if (!city) { return }
    city.open.value = !city.open.value
}
//不能一次渲染所有线路 否则以后2000个城市，炸了！
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
function closeAll() {
    real.forEach(x => x.open.value = false)
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
</script>

<template>
    <SideBar ref="sidebar" @click="closePickers">
        <div class="noScroll">
            <h2 @click="closeAll()">
                颜色库
            </h2>
            <div class="smallNote">
                点击标题可收起所有城市
            </div>
            <div class="smallNote" target="_blank" href="http://wiki.jowei19.com/#/w/yan-se-ku-geng-xin-ri-zhi" style="color:darkblue">
                更新日志
            </div>
            <div class="switch1">
                <Switch :left-text="'标准'" :right-text="'严谨'" :initial="'left'" @left="viewUnofficialColors = true"
                    @right="viewUnofficialColors = false"></Switch>
            </div>
            <div class="switch2">
                <Switch :left-text="'主名'" :right-text="'副名'" :initial="'left'" @left="viewSubnames = false"
                    @right="viewSubnames = true"></Switch>
            </div>
            <table>
                <tbody>
                    <tr>
                        <td colspan="2" class="nameAndColorTd">
                            <div>
                                <template v-if="!haveParent">
                                    <AuColorPicker :initial="props.editingLine.color"
                                        @done="c => { props.editingLine.color = c; emit('colorUpdated'); envStore.lineInfoChanged(props.editingLine) }"
                                        ref="picker0" :panel-base-z-index="10000" :show-package-name="false"
                                        :entry-respond-delay="1" :panel-click-stop-propagation="true"
                                        :entry-styles="pickerEntryStyles"></AuColorPicker>
                                </template>
                                <span>
                                    🔍<input v-model="searchFilter">
                                </span>
                                <div class="smallNote">
                                    支持完整和不完整以及仅首字母的拼音搜索
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="yflow">
                <div class="lineColorArea">
                    <div
                        v-for="city in real.filter(ct => (!searchFilter) || getCityName(ct.data).includes(searchFilter.toLocaleLowerCase()))">
                        <h3 @click="openCity(city.pri)" class="city">
                            <span v-if="city.open.value" class="opened"><span v-if="city.pri > 499">*</span>{{ city.name
                                }}</span>
                            <span v-else class="closed"><span v-if="city.pri > 499">*</span>{{ city.name }}</span>
                        </h3>
                        <div v-if="city.open.value">
                            <span v-for="line in parseCity(city.data)">
                                <button v-if="viewUnofficialColors || !line.isUnofficial"
                                    :style="{ backgroundColor: line.color, color: colorProcStore.colorProcInvBinary.convert(line.color) }"
                                    class="colorSelect" @click="setColor(line.color)">
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
        </div>
    </SideBar>
</template>

<style lang="scss">
@use './configs/shared/configSection.scss';
</style>
<style lang="scss">
h3 {
    text-align: center;
}

.colorSelect {
    font-size: small;
    padding: 2px;
}

.yflow {
    overflow-y: auto;
    user-select: none;
    width: 280px;
    left: 0px;

}

.lineColorArea {
    width: 270px;
    left: 0px;
    height: 60%;
    bottom: 0px;
}

.editingLine {
    width: '240px';
    height: '26px'
}

.nameAndColorTd {
    background-color: white;

    &>div {
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;

        span {
            width: 240px;
        }

        input {
            background-color: #eee;
            text-align: center;
            margin: 0px;
            font-size: 14px;
            border: none;
        }

        input:first-child {
            font-size: 18px;
        }
    }
}

.opened {
    color: #222;
}

.closed {
    color: #777;
}

.switch1 {
    position: absolute;
    right: 25px;
    top: 25px;
}

.switch2 {
    position: absolute;
    right: 90px;
    top: 25px;
}

.switchTd {
    background-color: rgba(255, 255, 255, 0);

}

.noScroll {
    overflow-y: hidden;
}
</style>