<script setup lang="ts">
import { useTemplateRef } from 'vue';
import SideBar from '../common/SideBar.vue';
import { enableContextMenu, disableContextMenu } from '@/utils/eventUtils/contextMenu';
import TextTagConfig from './configs/TextTagConfig.vue';
import LineGroupConfig from './configs/LineGroupConfig.vue';
import LineStylesConfig from './configs/LineStylesConfig.vue';
import EditorConfig from './configs/EditorConfig.vue';
import FaqAsConfig from './configs/FaqAsConfig.vue';
import TextTagIconConfig from './configs/TextTagIconConfig.vue';
import PinyinConvertConfig from './configs/PinyinConvertConfig.vue';
import SaveConfigReuse from './configs/SaveConfigReuse.vue';
import BgRefImageConfig from './configs/BgRefImageConfig.vue';
import FontConfig from './configs/FontConfig.vue';
import PatternsConfig from './configs/PatternsConfig.vue';
import LineWidthMappedConfig from './configs/LineWidthMappedConfig.vue';
import EtcConfig from './configs/EtcConfig.vue';

const sidebar = useTemplateRef('sidebar')
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar" @extend="enableContextMenu()" @fold="disableContextMenu()" :enforce-y-scroll="true">
<LineStylesConfig></LineStylesConfig>

<LineGroupConfig></LineGroupConfig>

<LineWidthMappedConfig></LineWidthMappedConfig>

<TextTagConfig></TextTagConfig>

<TextTagIconConfig></TextTagIconConfig>

<PatternsConfig></PatternsConfig>

<FontConfig></FontConfig>

<EditorConfig></EditorConfig>

<PinyinConvertConfig></PinyinConvertConfig>

<BgRefImageConfig></BgRefImageConfig>

<SaveConfigReuse></SaveConfigReuse>

<FaqAsConfig></FaqAsConfig>

<EtcConfig></EtcConfig>

</SideBar>
</template>