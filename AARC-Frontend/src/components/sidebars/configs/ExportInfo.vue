<script setup lang="ts">
import { ref } from 'vue';
import SideBar from '@/components/common/SideBar.vue';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import ConfigSection from '../configs/shared/ConfigSection.vue';
import { LineType } from '@/models/save';
import { removeConsecutiveSameItem } from "@/utils/lang/removeConsecutiveSameItem";
import copy from 'copy-to-clipboard';

const sidebar = ref<InstanceType<typeof SideBar>>()
const saveStore = useSaveStore()
const staClusterStore = useStaClusterStore()
const { pop } = useUniqueComponentsStore()

const wikiMode=ref(true)

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
    if (!cluster) {
        let point = saveStore.save?.points.find(x => x.id == ptid)
        if (point)
            return point.name
        else
            return ''
    }
    else {
        let clusterHaveName = cluster.find(x => x.name)
        if (clusterHaveName)
            return clusterHaveName.name
        else
            return ''
    }
}
async function copyLineListTxt() {
    let txt = '|线路|颜色|起点|终点|\n'
    saveStore.save?.lines.filter(l => l.type == LineType.common && !l.isFake).forEach(l => {
        let lname = parseLineName(l.name)
        txt += `|${lname}|/-c-/${l.color}|`
        let firstStaName = getStaName(l.pts[0])
        let lastStaName = getStaName(l.pts[l.pts.length - 1])
        if (firstStaName != lastStaName)
            txt += `${firstStaName}|${lastStaName}|`
        else {
            txt += `环行||`
        }
        txt+='\n'
    })
    copyText(txt)
}
async function copyStaNameListTxt() {
    let txt = ''
    const clusters = staClusterStore.getStaClusters()
    saveStore.save?.lines.filter(l => l.type == LineType.common && !l.isFake).forEach(l => {
        let lname = parseLineName(l.name)

        if (exportColorInfo.value) {
            txt += `# ${lname} \n${l.color}#\n`
        }
        else {
            txt += `# ${lname}\n`
        }
        let stationNameList: string[] = []
        l.pts.forEach(p => {
            const cluster = clusters?.find(cluster =>
                cluster.some(sta => sta.id === p)
            );
            if (cluster) {
                let staHaveName = cluster.find(c => c.name)
                if (staHaveName)
                    if (staHaveName.name)
                        stationNameList.push(staHaveName.name)
            }
            else {
                let staHaveName = saveStore.save?.points.find(x => x.id == p)
                if (staHaveName)
                    if (staHaveName.name)
                        stationNameList.push(staHaveName.name)
            }
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
defineExpose({
    comeOut: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})

</script>

<template>
    <ConfigSection :title="'导出作品信息'">
        <table>
            <tbody>
                <tr>
                    <td>
                        站名分隔符
                        <div class="note">
                            默认为空格；用\n换行
                        </div>
                    </td>
                    <td>
                        <input v-model="staNameSplitChar" style="width: 2em;">
                    </td>
                </tr>
                <tr>
                    <td>
                        站名分隔符
                        <div class="note">
                            默认为空格；用\n换行
                        </div>
                    </td>
                    <td>
                        <input v-model="staNameSplitChar" style="width: 2em;">
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
                        数字路号移除首位的“0”
                        <div class="note">
                            "01"转为"1"
                        </div>
                    </td>
                    <td>
                        <input v-model="removeZeroOnFirstChar" type="checkbox">
                    </td>
                </tr>
                <tr>
                    <td>
                        自动补全线路名
                        <div class="note">
                            为数字和字母线路补全“号线”和“线”：1号线，A线，S1线
                        </div>
                    </td>
                    <td>
                        <input v-model="autoLineSuffix" type="checkbox">
                    </td>
                </tr>
                <tr v-if="autoLineSuffix">
                    <td>
                        线路名后缀为“号线”
                        <div class="note">
                            开启后S1将补全为S1号线，而非S1线
                        </div>
                    </td>
                    <td>
                        <input v-model="autoLineSuffixHaoxian" type="checkbox">
                    </td>
                </tr>
            </tbody>
        </table>
        <button @click="copyStaNameListTxt" class="minor">复制站名列表（适用于Fic3Wiki）</button>
        <button @click="copyLineListTxt" class="minor">复制线路列表（适用于Fic3Wiki）</button>
    </ConfigSection>
</template>

<style scoped lang="scss">

.note {
    margin: 8px 0px;
    font-size: 14px;
    color: #999;
    text-align: center;
}
button{
    text-align: center;
}
</style>