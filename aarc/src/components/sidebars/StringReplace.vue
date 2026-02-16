<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';

const { showPop } = useUniqueComponentsStore();
const saveStore = useSaveStore();
const envStore = useEnvStore();

const findText = ref('');
const replaceText = ref('');

interface ReplaceTarget {
  key: string;
  label: string;
  checked: boolean;
}

const targets = ref<ReplaceTarget[]>([
  { key: 'staName', label: '站名', checked: true },
  { key: 'staNameS', label: '副站名', checked: false },
  { key: 'textTagText', label: '标签主文本', checked: false },
  { key: 'textTagTextS', label: '标签副文本', checked: false },
  { key: 'lineNameCommon', label: '线路主名', checked: false },
  { key: 'lineNameSubCommon', label: '线路副名', checked: false },
  { key: 'lineNameTerrain', label: '地形主名', checked: false },
  { key: 'lineNameSubTerrain', label: '地形副名', checked: false }
]);

const selectedTargets = computed(() => targets.value.filter(t => t.checked));

function executeReplace() {
  if (!saveStore.save) {
    showPop('未找到存档', 'failed');
    return;
  }

  if (!findText.value.trim()) {
    showPop('请输入要查找的文本', 'failed');
    return;
  }

  if (selectedTargets.value.length === 0) {
    showPop('请至少选择一个替换对象', 'failed');
    return;
  }

  const { replaceCount, changedPtIds, changedLineIds } = performReplace();
  
  if (replaceCount > 0) {
    showPop(`替换完成！共替换了 ${replaceCount} 处`, 'success');
    
    if (changedLineIds.length > 0 || changedPtIds.length > 0) {
      envStore.rerender(changedLineIds, changedPtIds);
    }
  } else {
    showPop('未找到匹配的文本', 'info');
  }
}

function performReplace() {
  let replaceCount = 0;
  const changedPtIds = new Set<number>();
  const changedLineIds = new Set<number>();

  selectedTargets.value.forEach(target => {
    const handler = replaceHandlers[target.key];
    if (handler) {
      const result = handler(findText.value, replaceText.value);
      replaceCount += result.count;
      result.ptIds?.forEach(id => changedPtIds.add(id));
      result.lineIds?.forEach(id => changedLineIds.add(id));
    }
  });

  return {
    replaceCount,
    changedPtIds: Array.from(changedPtIds),
    changedLineIds: Array.from(changedLineIds)
  };
}

interface ReplaceHandler {
  (find: string, replace: string): {
    count: number;
    ptIds?: number[];
    lineIds?: number[];
  };
}

const replaceHandlers: Record<string, ReplaceHandler> = {
  staName: (find, replace) => handlePoints('name', find, replace),
  staNameS: (find, replace) => handlePoints('nameS', find, replace),
  textTagText: (find, replace) => handleTextTags('text', find, replace),
  textTagTextS: (find, replace) => handleTextTags('textS', find, replace),
  lineNameCommon: (find, replace) => handleLines(LineType.common, 'name', find, replace),
  lineNameSubCommon: (find, replace) => handleLines(LineType.common, 'nameSub', find, replace),
  lineNameTerrain: (find, replace) => handleLines(LineType.terrain, 'name', find, replace),
  lineNameSubTerrain: (find, replace) => handleLines(LineType.terrain, 'nameSub', find, replace)
};

function handlePoints(
  prop: 'name' | 'nameS',
  find: string,
  replace: string
) {
  const ptIds: number[] = [];
  let count = 0;

  saveStore.save!.points.forEach(pt => {
    const value = pt[prop];
    if (value && value.includes(find)) {
      pt[prop] = value.replaceAll(find, replace);
      count++;
      ptIds.push(pt.id);
    }
  });

  return { count, ptIds };
}

function handleTextTags(
  prop: 'text' | 'textS',
  find: string,
  replace: string
) {
  let count = 0;

  saveStore.save!.textTags.forEach(tag => {
    const value = tag[prop];
    if (value && value.includes(find)) {
      tag[prop] = value.replaceAll(find, replace);
      count++;
    }
  });

  return { count };
}

function handleLines(
  lineType: LineType,
  prop: 'name' | 'nameSub',
  find: string,
  replace: string
) {
  const lineIds: number[] = [];
  let count = 0;

  saveStore.save!.lines.forEach(line => {
    if (line.type === lineType) {
      const value = line[prop];
      if (value && value.includes(find)) {
        line[prop] = value.replaceAll(find, replace);
        count++;
        lineIds.push(line.id);
      }
    }
  });

  return { count, lineIds };
}
</script>

<template>
        <div class="smallNote">文本替换</div>
    <div class="input-group">
      <label>查找文本：</label>
      <input 
        v-model="findText" 
        type="text" 
        placeholder="输入要查找的文本"
        @keyup.enter="executeReplace"
      />
    </div>
    
    <div class="input-group">
      <label>替换为：</label>
      <input 
        v-model="replaceText" 
        type="text" 
        placeholder="输入替换后的文本"
        @keyup.enter="executeReplace"
      />
    </div>
    
    <div class="smallNote">选择替换对象：</div>
    <div class="targets-list">
      <label 
        v-for="target in targets" 
        :key="target.key" 
        class="target-item"
      >
        <input v-model="target.checked" type="checkbox" />
        <span>{{ target.label }}</span>
      </label>
    </div>
    
    <button 
      @click="executeReplace" 
      class="ok"
      :disabled="!findText.trim() || selectedTargets.length === 0"
    >
      执行替换
    </button>
</template>

<style scoped lang="scss">
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  
  label {
    font-size: 14px;
    color: #666;
  }
  
  input[type="text"] {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
}

.targets-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 12px 0;
}

.target-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ok {
  margin-top: 12px;
  width: 100%;
}

</style>