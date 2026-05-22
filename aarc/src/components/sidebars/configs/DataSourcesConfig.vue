<script setup lang="ts">
import { DataSource } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import ConfigSection from './shared/ConfigSection.vue';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useIconStore } from '@/models/stores/iconStore';
import { useEnvStore } from '@/models/stores/envStore';
import { fetchDataSource, mergeDataSourceItems } from '@/models/save/dataSourceOps';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const { showPop } = useUniqueComponentsStore()
const iconStore = useIconStore()
const envStore = useEnvStore()

const typeLabel: Record<DataSource['type'], string> = {
    lineStyles: '线路样式',
    textTagIcons: '文本标签图标',
    patterns: '纹理'
}

const creating = ref<DataSource>({ id: 0, url: '', type: 'lineStyles' })
const createAllowed = ref(false)

function validateCreating() {
    const c = creating.value
    createAllowed.value = !!c.url.trim() && !!c.name?.trim()
}

function addDataSource() {
    if (!createAllowed.value || !save.value) return
    const ds: DataSource = {
        id: saveStore.getNewId(),
        name: creating.value.name?.trim(),
        url: creating.value.url.trim(),
        type: creating.value.type
    }
    save.value.dataSources ??= []
    save.value.dataSources.push(ds)
    creating.value = { id: 0, url: '', type: 'lineStyles' }
    createAllowed.value = false
}

function removeDataSource(id: number) {
    if (!save.value?.dataSources) return
    const idx = save.value.dataSources.findIndex(x => x.id === id)
    if (idx >= 0) {
        save.value.dataSources.splice(idx, 1)
    }
}

const loadingIds = ref<Set<number>>(new Set())

interface DsLoadResult {
    msg: string
    type: 'success' | 'warning' | 'error'
}
const dsResults = ref<Map<number, DsLoadResult>>(new Map())
const dsResultTimers = ref<Map<number, number>>(new Map())

function setDsResult(dsId: number, msg: string, type: DsLoadResult['type']) {
    const existingTimer = dsResultTimers.value.get(dsId)
    if (existingTimer !== undefined) {
        clearTimeout(existingTimer)
        dsResultTimers.value.delete(dsId)
    }
    dsResults.value.set(dsId, { msg, type })
    if (type !== 'error') {
        const timerId = window.setTimeout(() => {
            dsResultTimers.value.delete(dsId)
            clearDsResult(dsId)
        }, 5000)
        dsResultTimers.value.set(dsId, timerId)
    }
}
function clearDsResult(dsId: number) {
    dsResults.value.delete(dsId)
}



async function loadDataSource(ds: DataSource) {
    if (!save.value) return
    loadingIds.value.add(ds.id)
    clearDsResult(ds.id)
    try {
        const result = await fetchDataSource(ds.url)
        if (!result.ok || result.data === undefined) {
            setDsResult(ds.id, result.errmsg || '加载失败', 'error')
            return
        }
        const report = mergeDataSourceItems(save.value, saveStore.getNewId, ds, result.data)
        const detailMsgs: string[] = []
        if (report.added > 0) detailMsgs.push(`新增 ${report.added} 项`)
        if (report.overwritten > 0) detailMsgs.push(`覆盖 ${report.overwritten} 项`)
        if (report.skipped > 0) detailMsgs.push(`跳过 ${report.skipped} 项`)
        if (report.errors.length > 0) detailMsgs.push(...report.errors)

        const hasError = report.errors.length > 0
        const hasChange = report.added > 0 || report.overwritten > 0
        if (hasError) {
            setDsResult(ds.id, detailMsgs.join('，'), 'error')
        } else if (hasChange) {
            setDsResult(ds.id, detailMsgs.join('，'), 'success')
        } else {
            setDsResult(ds.id, detailMsgs.join('，') || '无变化', 'warning')
        }

        if (ds.type === 'textTagIcons') {
            await iconStore.ensureAllLoaded()
        }
        if (ds.type === 'lineStyles' || ds.type === 'patterns') {
            envStore.rerender()
        }
    } finally {
        loadingIds.value.delete(ds.id)
    }
}

async function loadAll() {
    const dss = save.value?.dataSources
    if (!dss || dss.length === 0) return
    let successCount = 0
    let failCount = 0
    for (const ds of dss) {
        await loadDataSource(ds)
        const result = dsResults.value.get(ds.id)
        if (result?.type === 'error') {
            failCount++
        } else {
            // success 和 warning（如跳过/无变化）都算成功
            successCount++
        }
    }
    showPop(`成功 ${successCount} 个，失败 ${failCount} 个`, failCount > 0 ? 'warning' : 'success')
}
</script>

<template>
<ConfigSection :title="'数据源'">
<div class="dataSources">
    <div class="smallNote" style="text-align: center;">
        添加返回 JSON 数组的 URL，可一键导入线路样式、图标或纹理
    </div>

    <div v-for="ds in save?.dataSources" :key="ds.id" class="dsItem">
        <div class="dsHead">
            <span class="dsName">{{ ds.name || '未命名' }}</span>
            <span class="dsType">{{ typeLabel[ds.type] }}</span>
        </div>
        <div class="dsUrl">{{ ds.url }}</div>
        <div class="dsFlags">
            <span
                class="flag"
                :class="{ off: !ds.autoUpdate }"
                @click="ds.autoUpdate = !ds.autoUpdate">
                自动更新{{ ds.autoUpdate ? '开' : '关' }}
            </span>
            <span
                class="flag"
                :class="{ off: !ds.overwriteSameName }"
                @click="ds.overwriteSameName = !ds.overwriteSameName">
                覆盖同名{{ ds.overwriteSameName ? '开' : '关' }}
            </span>
        </div>
        <div v-if="dsResults.get(ds.id)" class="dsResult" :class="dsResults.get(ds.id)!.type">
            {{ dsResults.get(ds.id)!.msg }}
        </div>
        <div class="dsOps">
            <button
                :class="loadingIds.has(ds.id) ? 'off' : 'ok'"
                :disabled="loadingIds.has(ds.id)"
                @click="loadDataSource(ds)">
                {{ loadingIds.has(ds.id) ? '加载中...' : '加载' }}
            </button>
            <button class="cancel" @click="removeDataSource(ds.id)">删除</button>
        </div>
    </div>

    <div v-if="save?.dataSources && save.dataSources.length > 1" class="dsOps" style="justify-content: center;">
        <button class="ok" @click="loadAll">全部加载</button>
    </div>

    <div class="newDs">
        <div class="newDsTitle">添加数据源</div>
        <div class="dsField">
            <span>名称</span><input v-model="creating.name" @input="validateCreating" placeholder="必填"/>
        </div>
        <div class="dsField">
            <span>链接</span><input v-model="creating.url" @input="validateCreating" placeholder="https://..."/>
        </div>
        <div class="dsField typeField">
            <select v-model="creating.type">
                <option value="lineStyles">线路样式</option>
                <option value="textTagIcons">文本标签图标</option>
                <option value="patterns">纹理</option>
            </select>
        </div>
        <div class="dsChecks">
            <label>
                <input type="checkbox" v-model="creating.autoUpdate" />
                启动时自动更新
            </label>
            <label>
                <input type="checkbox" v-model="creating.overwriteSameName" />
                覆盖同名项目
            </label>
        </div>
        <button @click="addDataSource" :class="createAllowed ? 'ok':'off'">添加</button>
    </div>
</div>
</ConfigSection>
</template>

<style scoped lang="scss">
.dataSources{
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.dsItem{
    border-radius: 10px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0px 0px 5px 0px #ccc;
    background-color: #eee;
    overflow: hidden;
    .dsHead{
        display: flex;
        justify-content: space-between;
        align-items: center;
        .dsName{
            font-weight: bold;
            font-size: 14px;
        }
        .dsType{
            font-size: 12px;
            color: #666;
            background: #eee;
            padding: 2px 6px;
            border-radius: 4px;
        }
    }
    .dsUrl{
        font-size: 12px;
        color: #666;
        word-break: break-all;
    }
    .dsOps{
        display: flex;
        justify-content: center;
        gap: 6px;
    }
}
.dsOps{
    display: flex;
    justify-content: center;
    gap: 6px;
}
.newDs{
    border-radius: 10px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0px 0px 5px 0px #ccc;
    background-color: #eee;
    overflow: hidden;
    .newDsTitle{
        font-weight: bold;
        font-size: 14px;
    }
    .dsField{
        display: flex;
        align-items: center;
        gap: 6px;
        input{
            width: 180px;
            font-size: 13px;
        }
        &.typeField{
            justify-content: center;
            select{
                width: 180px;
            }
        }
    }
    .dsChecks{
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        color: #666;
        label{
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        }
    }
}
.dsFlags{
    display: flex;
    gap: 6px;
    .flag{
        font-size: 11px;
        color: #fff;
        background: cornflowerblue;
        padding: 1px 5px;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
        &.off{
            background: #bbb;
        }
    }
}
.dsResult{
    font-size: 12px;
    padding: 4px 6px;
    border-radius: 4px;
    &.success{
        color: #2a7;
        background: #e8f5e9;
    }
    &.warning{
        color: #a70;
        background: #fff8e1;
    }
    &.error{
        color: #c22;
        background: #ffebee;
    }
}
</style>
