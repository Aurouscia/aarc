<script setup lang="ts">
import { useConfigStore } from '@/models/stores/configStore';
import { storeToRefs } from 'pinia';
import ConfigSection from './shared/ConfigSection.vue';
import { onMounted } from 'vue';
import { PinyinCaseType } from '@/app/com/apiGenerated';

const { config } = storeToRefs(useConfigStore())
onMounted(()=>{
    config.value.pinyinConvert ??= {
        caseType: 0,
        rules: "公园:Park\n广场:Square\n路:Rd.\n街:St."
    }
})
</script>

<template>
<ConfigSection :title="'站名拼音转换'">
<table v-if="config.pinyinConvert">
    <tbody>
        <tr>
            <td>大小写</td>
            <td>
                <select v-model="config.pinyinConvert.caseType">
                    <option :value="PinyinCaseType.Pascal">首字母大写</option>
                    <option :value="PinyinCaseType.AllUpper">全大写</option>
                    <option :value="PinyinCaseType.AllLower">全小写</option>
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
    </tbody>
</table>
</ConfigSection>
</template>

<style lang="scss" scoped>
textarea{
    width: 180px;
    height: 205px;
}
</style>