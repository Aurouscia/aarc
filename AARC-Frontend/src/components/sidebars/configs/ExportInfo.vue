<script setup lang="ts">
import { ref} from 'vue';
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

const staNameSplitChar = ref('')
const autoLineSuffix = ref(false)
const autoLineSuffixHaoxian = ref(false)
const removeZeroOnFirstChar = ref(false)
const exportColorInfo = ref(true)

async function downloadStaNameListTxt() {
    let txt = ''
    const clusters = staClusterStore.getStaClusters()
    saveStore.save?.lines.filter(l => l.type == LineType.common && !l.isFake).forEach(l => {
        let lname = l.name
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
        if (exportColorInfo.value) { txt += `# ${lname}\n${l.color}#\n` }
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
    const success = copy(txt);
    if (success) {
        pop?.show('已复制', 'success');
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
        <button @click="downloadStaNameListTxt" class="minor">复制站名列表（适用于wiki）</button>
    </ConfigSection>
</template>

<style scoped lang="scss">
.ok {
    margin-top: 20px;
}

.configItem {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .itemName {
        color: #666;
    }

    input {
        max-width: 120px;
    }
}

.explainItem {
    color: #333;
    font-size: 14px;
}

.exportOps {
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.note {
    margin: 8px 0px;
    font-size: 14px;
    color: #999;
    text-align: center;

    .downloadAnchor {
        color: cornflowerblue;
        text-decoration: underline;
    }
}

.browserLimit {
    font-size: 14px;
}
</style>