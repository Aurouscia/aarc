<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { onMounted } from 'vue';
import { PinyinCaseType, PinyinVariantType } from '@/app/com/apiGenerated';
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';

const { config } = storeToRefs(useConfigStore())
const { tabForPinyinConvert } = storeToRefs(useEditorLocalConfigStore())
onMounted(()=>{
    config.value.pinyinConvert ??= {
        caseType: 0,
        variantType: 0,
        rules: "公园:Park\n广场:Square\n路$:Rd.\n街$:St."
    }
})
</script>

<template>
<ConfigSection :title="'站名拼音转换'">
<table v-if="config.pinyinConvert">
    <tbody>
        <tr>
            <td style="min-width: 50px;">大小写</td>
            <td>
                <select v-model="config.pinyinConvert.caseType">
                    <option :value="PinyinCaseType.Pascal">每字首字母大写</option>
                    <option :value="PinyinCaseType.FirstUpper">整体首字母大写</option>
                    <option :value="PinyinCaseType.AllUpper">全大写</option>
                    <option :value="PinyinCaseType.AllLower">全小写</option>
                </select>
            </td>
        </tr>
        <tr>
            <td style="min-width: 50px;">方言</td>
            <td>
                <select v-model="config.pinyinConvert.variantType">
                    <option :value="PinyinVariantType.Mandarin">普通话</option>
                    <option :value="PinyinVariantType.Cantonese">广东话</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>字间<br/>空格</td>
            <td>
                <input v-model="config.pinyinConvert.spaceBetweenChars" type="checkbox">
            </td>
        </tr>
        <tr>
            <td>
                自定义<br/>规则
            </td>
            <td>
                <textarea v-model="config.pinyinConvert.rules"></textarea>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="smallNote">
                    <p>根据个人需求添加更多翻译规则，例如:</p>
                    <p class="example-p">大学:University、会展中心:Expo Center</p>
                    <p class="example-p">南站:South Rwy Sta、城市名:城市英文名</p>
                    <p>^表示开头处、$表示结尾处，例如:</p>
                    <p class="example-p">^省:provincial、站$:Rwy Sta</p>
                </div>
            </td>
        </tr>
        <tr>
            <td>tab键<br/>使用</td>
            <td>
                <input v-model="tabForPinyinConvert" type="checkbox"> 
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="smallNote">
                    <p>关于“tab键使用”选项：</p>
                    <p>1.输入主站名后，按tab键可切换为选中副站名输入框，勾选此项后使用tab切换到副站名时会自动进行一次拼音转换</p>
                    <p>2.注意：为避免覆盖，仅在副站名为空时生效</p>
                    <p>3.本设置与存档无关，仅保存在浏览器里</p>
                    <p>4.提示：选中车站后，第一次按tab可开始输入主站名，第二次按tab即自动生成副站名</p>
                </div>
            </td>
        </tr>
    </tbody>
</table>
</ConfigSection>
</template>

<style lang="scss" scoped>
textarea{
    width: 180px;
    height: 205px;
}
.smallNote{
    text-align: left;
}
.example-p{
    margin-left: 10px;
}
</style>