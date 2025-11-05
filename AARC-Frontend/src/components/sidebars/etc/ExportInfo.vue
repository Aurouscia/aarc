<script setup lang="ts">
import { ref } from 'vue';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import ConfigSection from '../configs/shared/ConfigSection.vue';
import { LineType } from '@/models/save';
import { removeConsecutiveSameItem } from "@/utils/lang/removeConsecutiveSameItem";
import copy from 'copy-to-clipboard';

const saveStore = useSaveStore()
const staClusterStore = useStaClusterStore()
const { pop } = useUniqueComponentsStore()

const wikiMode = ref(false)
const staNameSplitChar = ref('')
const autoLineSuffix = ref(true)
const autoLineSuffixHaoxian = ref(false)
const removeZeroOnFirstChar = ref(true)
const exportColorInfo = ref(true)

function parseLineName(lname: string) {
    if (removeZeroOnFirstChar.value) {
        lname = lname.replace(/^0+/, '')
    }
    if (autoLineSuffix.value) {
        if (/^\d+$/.test(lname)) {
            //1号线
            lname += '号线'
        }
        if (/^[a-zA-Z]+$/.test(lname)) {
            //A线
            lname += '线';
        }
        // 检查是否是字母和数字的组合（至少包含一个字母）
        if (/^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(lname)) {
            if (autoLineSuffixHaoxian.value) {
                //S1号线
                lname += '号线'
            }
            else {
                //S1线
                lname += '线';
            }
        }
    }
    return lname
}
function getStaName(ptid: number) {
    const clusters = staClusterStore.getStaClusters()
    const cluster = clusters?.find(cluster =>
        cluster.some(sta => sta.id === ptid)
    );
    let res = undefined
    if (!cluster) {
        let point = saveStore.save?.points.find(x => x.id == ptid)
        res = point?.name
    }
    else {
        let clusterHaveName = cluster.find(x => x.name)
        res = clusterHaveName?.name
    }
    res = res?.replaceAll('\n', '')
    return res ?? ''
}
async function copyLineListTxt() {
    let txt = '|线路|颜色|起点|终点|\n'
    saveStore.save?.lines.filter(l => l.type == LineType.common && !l.isFake).forEach(l => {
        let lname = parseLineName(l.name)
        txt += `|${lname}|`
        if(wikiMode.value)
            txt += `/-c-/`
        txt += `${l.color}|`
        let firstStaName = getStaName(l.pts[0])
        let lastStaName = getStaName(l.pts[l.pts.length - 1])
        if (firstStaName != lastStaName)
            txt += `${firstStaName}|${lastStaName}|`
        else {
            txt += `环行||`
        }
        txt += '\n'
    })
    copyText(txt)
}
async function copyStaNameListTxt() {
    let txt = ''
    saveStore.save?.lines.filter(l => l.type == LineType.common && !l.isFake).forEach(l => {
        let lname = parseLineName(l.name)
        if (wikiMode.value) {
            if (exportColorInfo.value) {
                txt += `# ${lname} \n${l.color}#\n`
            }
            else {
                txt += `# ${lname}\n`
            }
        }
        else {
            if (exportColorInfo.value) {
                txt += `${lname} ${l.color}\n`
            }
            else {
                txt += `${lname}\n`
            }
        }

        let stationNameList: string[] = []
        l.pts.forEach(p => {
            stationNameList.push(getStaName(p)) 
        })
        stationNameList = removeConsecutiveSameItem(stationNameList)
        if (stationNameList.length > 1) {
            let splitChar = staNameSplitChar.value
            if (!splitChar) {
                splitChar = ' '
            }
            txt += stationNameList.join(splitChar) + '\n'
        }
    })
    copyText(txt)
}
function copyText(txt: string) {
    const success = copy(txt);
    if (success) {
        pop?.show(`复制成功，共${txt.length}字`, 'success');
    } else {
        pop?.show('复制失败，请改用正规浏览器', 'failed');
    }
}
</script>

<template>
    <ConfigSection :title="'导出作品信息（试验）'">
        <table class="fullWidth">
            <tbody>
                <tr>
                    <td>
                        用于ficCloud系统
                        <div class="smallNote">
                            http://wiki.jowei19.com
                        </div>
                    </td>
                    <td>
                        <input v-model="wikiMode" type="checkbox">
                    </td>
                </tr>
                <tr>
                    <td>
                        站名分隔符
                        <div class="smallNote">
                            默认为空格（可用\n换行）
                        </div>
                    </td>
                    <td>
                        <input v-model="staNameSplitChar" style="width: 3em;">
                    </td>
                </tr>
                <tr>
                    <td>
                        导出颜色信息
                    </td>
                    <td>
                        <input v-model="exportColorInfo" type="checkbox">
                    </td>
                </tr>
                <tr>
                    <td>
                        线路号移除首位“0”
                        <div class="smallNote">
                            02→2
                        </div>
                    </td>
                    <td>
                        <input v-model="removeZeroOnFirstChar" type="checkbox">
                    </td>
                </tr>
                <tr>
                    <td>
                        自动补全后缀
                        <div class="smallNote">
                            为数字/字母线路补全后缀<br/>
                            1→1号线，A→A线，S1→S1线
                        </div>
                    </td>
                    <td>
                        <input v-model="autoLineSuffix" type="checkbox">
                    </td>
                </tr>
                <tr :class={disabled:!autoLineSuffix}>
                    <td>
                        始终补全“号线”
                        <div class="smallNote">
                            S1→S1号线
                        </div>
                    </td>
                    <td>
                        <input v-model="autoLineSuffixHaoxian" type="checkbox" :disabled="!autoLineSuffix">
                    </td>
                </tr>
            </tbody>
        </table>
        <button @click="copyStaNameListTxt" class="minor">复制站名列表</button>
        <button @click="copyLineListTxt" class="minor">复制线路列表</button>
    </ConfigSection>
</template>

<style scoped lang="scss">
button {
    display: block;
    margin: 10px auto;
}
button:last-child{
    margin-bottom: 100px;
}
.disabled, .disabled *{
    color: #aaa
}
</style>