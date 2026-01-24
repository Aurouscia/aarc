<script setup lang="ts">
import { computed, onMounted, useTemplateRef, ref, watch } from 'vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { ControlPoint,Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { useNameSearchStore } from '@/models/stores/nameSearchStore';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { useLineStateStore } from '@/models/stores/saveDerived/state/lineStateStore';

const saveStore = useSaveStore();
const lineStateStore = useLineStateStore()
const envStore = useEnvStore();
const staClusterStore = useStaClusterStore()
const cvs = useCvsFrameStore();

const searchInput = useTemplateRef('searchInput')
const nameSearchStore = useNameSearchStore()
const { show, searchText, showResults } = storeToRefs(nameSearchStore)

// 当前选中的结果索引
const selectedIndex = ref(-1)

const maxResultCount = 50

// 匹配逻辑：name 或 nameS 包含搜索串（不区分大小写）
const resultsRaw = computed(()=>{
  const q = searchText.value?.trim();
  if(!q) return [];
  const s = q.toLowerCase();
  const pts = saveStore.save?.points || [];
  // 限制最大返回数量，防止太长下拉
  const matched = pts.filter(pt=>{
    const name = (pt.name ?? '').toString();
    const nameS = (pt.nameS ?? '').toString();
    return name.toLowerCase().includes(s) || nameS.toLowerCase().includes(s);
  })
  return matched;
});

const results = computed(()=>{
    return resultsRaw.value.slice(0, maxResultCount).filter(x=>getPtLines(x).length>0);
})

// 监听搜索结果变化，重置选中索引
watch(results, () => {
  selectedIndex.value = -1
})

function resultElId(ptid:number){
  return `resultElId_${ptid}`
}

// 监听选中索引变化，确保选中元素在视图内
watch(selectedIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < results.value.length) {
    const selectedPt = results.value[newIndex]
    const elementId = resultElId(selectedPt.id)
    const selectedElement = document.getElementById(elementId)
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }
})

function centerOnPt(pt:ControlPoint){
  cvs.focusViewToPos(pt.pos)
  envStore.activePt = pt;
  envStore.cursorPos = [...pt.pos]
  nameSearchStore.toggleShow(false)
}

const keyboardInCharge = ref(false)

// 处理键盘导航
function handleKeyDown(event: KeyboardEvent) {
  if (!showResults.value || results.value.length === 0)
    return
  keyboardInCharge.value = true
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % results.value.length
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value <= 0 ? results.value.length - 1 : selectedIndex.value - 1
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0 && selectedIndex.value < results.value.length) {
        centerOnPt(results.value[selectedIndex.value])
      } else if (results.value.length > 0) {
        // 如果没有选中任何结果，按回车键默认选中第一个结果
        centerOnPt(results.value[0])
      }
      break
  }
}

// 辅助：获取该站所属线路信息（name + color）
function getPtLines(pt:ControlPoint){
  const cluster = staClusterStore.getStaClusterById(pt.id)
  const stationIds = cluster ? cluster.map(sta => sta.id) : [pt.id];
  const lines =[...new Set(stationIds.flatMap(id => 
    saveStore.getLinesByPt(id) ?? []
  ))]
  return lines.filter(x=>!x.isFake).map((l:Line)=>({
    id: l.id,
    name: l.name || '',
    color: lineStateStore.getLineActualColorById(l.id) || l.color || '#000',
  }))
}

onMounted(()=>{
  if(!searchInput.value)
    throw new Error('searchInput 获取失败')
  nameSearchStore.init(searchInput.value)
  // 添加键盘事件监听
  searchInput.value.addEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="bangPanel searchStation" :class="{retracted:!show}">
    <input
      ref="searchInput"
      v-model="searchText"
      class="searchInput"
      placeholder="搜索站名"
    />
    <div v-if="showResults" class="resultsPanel" @mousemove="keyboardInCharge=false">
      <div v-if="results.length === 0" class="noRes">未找到相关站点</div>
      <div class="resList">
        <div v-if="results.length > 5" class="resItemCount">
          共{{ resultsRaw.length }}个结果{{ 
            resultsRaw.length > maxResultCount ? `，仅显示前${maxResultCount}个` : '' 
          }}
        </div>
        <div 
          v-for="(pt, index) in results" 
          :key="pt.id" 
          :id="resultElId(pt.id)"
          class="resItem" 
          :class="{ selected: index === selectedIndex }"
          @click="centerOnPt(pt)"
          @mouseenter="()=>{!keyboardInCharge && (selectedIndex=index)}"
        >
          <div class="resMain">
            <div class="resName">{{ pt.name ?? '—' }}</div>
            <div class="resNameS">{{ pt.nameS ?? '' }}</div>
          </div>
          <div class="resLines">
            <template v-for="ln in getPtLines(pt)">
              <span class="lineBadge" :style="{ backgroundColor: ln.color }" :title="ln.name"></span>
            </template>
          </div>
        </div>
        <div v-if="results.length > 5" class="resItemCount">提示：PC端可使用键盘上下Enter键导航</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.searchStation{
  .searchInput{
    width: 300px;
    border: none;
    margin: 0px;
  }
  .resultsPanel{
    position: absolute;
    margin-top:4px;
    width: 300px;
    max-height: 300px;
    overflow: auto;
    background: white;
    border-radius: 6px;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.4);
    border: 1px solid #e6e6e6;
    .noRes{
      color:#888;
      padding: 12px;
      font-size: 14px;
    }
    .resList{
      display:flex;
      flex-direction:column;
    }
    .resItem{
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:8px 10px;
      cursor: pointer;
      gap:10px;
      border-top: 1px solid #f3f3f3;
      &:hover{
        background: #f6f8ff;
      }
      &.selected{
        background: #ddd;
      }
      .resMain{
        flex-shrink: 0;
        max-width: 140px;
        display:flex;
        flex-direction:column;
        .resName, .resNameS{
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .resName{
          font-weight:600;
          font-size:14px;
          color:#222;
        }
        .resNameS{
          font-size:12px;
          color:#666;
        }
      }
      .resLines{
        min-width: 0px;
        flex-shrink: 1;
        overflow-x: auto;
        display:flex;
        gap:4px;
        align-items:center;
        .lineBadge{
          width:14px;
          height:14px;
          border-radius:1000px;
          display:inline-block;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.06) inset;
        }
      }
    }
    .resItemCount{
      text-align: center;
      color: #999;
      font-size: 12px;
      padding: 4px 0px;
      border-top: 1px solid #f3f3f3;
      &:first-child{
        border-top: 0px;
      }
    }
  }
}
</style>