<script setup lang="ts">
import { configDefault, useConfigStore } from '@/models/stores/configStore';
import ConfigSection from './shared/ConfigSection.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { useTemplateRef } from 'vue';
import { Config } from '@/models/config';

const cs = useConfigStore()
const envStore = useEnvStore()
const pBg = useTemplateRef('pBg')
const pSta = useTemplateRef('pSta')
const pStaSub = useTemplateRef('pStaSub')
const pStaFill = useTemplateRef('pStaFill')
const pickers = [pBg, pSta, pStaSub, pStaFill]

function closeAllPickers(){
    for(const p of pickers){
        p.value?.closePanel()
    }
}
function recover(){
    const obj:Partial<Config> = {
        bgColor: configDefault.bgColor,
        staNameColor: configDefault.staNameColor,
        staNameSubColor: configDefault.staNameSubColor,
        ptStaFillColor: configDefault.ptStaFillColor
    }
    Object.assign(cs.config, obj)
    envStore.rerender([], [])
}
function setToDark(){
    const obj:Partial<Config> = {
        bgColor: '#222233',
        staNameColor: '#ffffff',
        staNameSubColor: '#dddddd',
        ptStaFillColor: '#111122'
    }
    Object.assign(cs.config, obj)
    envStore.rerender([], [])
}
</script>

<template>
<ConfigSection :title="'颜色设置（新）'">
    <table class="fullWidth" @click="closeAllPickers"><tbody>
        <tr>
            <td colspan="2">
                <button @click="recover">恢复默认</button>
                <button @click="setToDark">设为深色</button>
            </td>
        </tr>
        <tr>
            <td>背景</td>
            <td>
                <AuColorPicker v-model="cs.config.bgColor" :pos="-120" ref="pBg"
                    @done="envStore.rerender([], [])"
                    :panel-click-stop-propagation="true" :entry-respond-delay="1">
                </AuColorPicker>
            </td>
        </tr>
        <tr>
            <td>主站名</td>
            <td>
                <AuColorPicker v-model="cs.config.staNameColor" :pos="-120" ref="pSta"
                    @done="envStore.rerender([], [])"
                    :panel-click-stop-propagation="true" :entry-respond-delay="1">
                </AuColorPicker>
            </td>
        </tr>
        <tr>
            <td>副站名</td>
            <td>
                <AuColorPicker v-model="cs.config.staNameSubColor" :pos="-120" ref="pStaSub"
                    @done="envStore.rerender([], [])"
                    :panel-click-stop-propagation="true" :entry-respond-delay="1">
                </AuColorPicker>
            </td>
        </tr>
        <tr>
            <td>站点填充</td>
            <td>
                <AuColorPicker v-model="cs.config.ptStaFillColor" :pos="-120" ref="pStaFill"
                    @done="envStore.rerender([], [])"
                    :panel-click-stop-propagation="true" :entry-respond-delay="1">
                </AuColorPicker>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="smallNote">敬请期待：地形预设颜色</span>
            </td>
        </tr>
    </tbody></table>
</ConfigSection>
</template>

<style scoped lang="scss">
</style>