<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { ControlPoint,Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { useNameSearchStore } from '@/models/stores/nameSearchStore';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';

const saveStore = useSaveStore();
const envStore = useEnvStore();
const staClusterStore = useStaClusterStore()
const cvs = useCvsFrameStore();


const { show } = storeToRefs(useNameSearchStore())
const searchInput = ref<HTMLInputElement>();
const searchText = ref('');
const showResults = ref(false);

// 匹配逻辑：name 或 nameS 包含搜索串（不区分大小写）
const results = computed(()=>{
  const q = searchText.value.trim();
  if(!q) return [];
  const s = q.toLowerCase();
  const pts = saveStore.save?.points || [];
  // 限制最大返回数量，防止太长下拉
  const matched = pts.filter(pt=>{
    const name = (pt.name ?? '').toString();
    const nameS = (pt.nameS ?? '').toString();
    return name.toLowerCase().includes(s) || nameS.toLowerCase().includes(s);
  }).slice(0, 80).filter(x=>getPtLines(x).length>0);
  return matched;
});

watch(searchText, (v)=>{
  showResults.value = !!v && v.trim().length > 0;
});

function centerOnPt(pt:ControlPoint){
  cvs.focusViewToPos(pt.pos)
  envStore.activePt = pt;
  envStore.cursorPos = [...pt.pos]
  show.value = false
}

// 辅助：获取该站所属线路信息（name + color）
function getPtLines(pt:ControlPoint){
const staClusters=staClusterStore.getStaClusters()
  const cluster = staClusters?.find(cluster => 
    cluster.some(sta => sta.id === pt.id)
  );
  const stationIds = cluster ? cluster.map(sta => sta.id) : [pt.id];
  const lines = stationIds.flatMap(id => 
    saveStore.getLinesByPt(id) ?? []
  );
  return lines.filter(x=>!x.isFake).map((l:Line)=>({
    id: l.id,
    name: l.name || '',
    color: saveStore.getLineActualColorById(l.id) || l.color || '#000',
  }));
}

defineExpose({show})
watch(show, (newVal)=>{
  if(!newVal){
    searchText.value = ''
    showResults.value = false
  }
  else{
    if(searchInput.value)
      searchInput.value.focus()
  }
})
</script>

<template>
  <div class="bangPanel searchStation" :class="{retracted:!show}">
    <input
      ref="searchInput"
      v-model="searchText"
      class="searchInput"
      placeholder="搜索站名"
      @keydown.enter.prevent="() => { if(results.length>0) centerOnPt(results[0]) }"
    />
    <div v-if="showResults" class="resultsPanel">
      <div v-if="results.length === 0" class="noRes">未找到相关站点</div>
      <div v-else class="resList">
        <div v-for="pt in results" :key="pt.id" class="resItem" @click="centerOnPt(pt)">
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
      border-bottom: 1px solid #f3f3f3;
      &:hover{
        background: #f6f8ff;
      }
      .resMain{
        display:flex;
        flex-direction:column;
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
        display:flex;
        gap:6px;
        align-items:center;
        .lineBadge{
          width:14px;
          height:14px;
          border-radius:50%;
          display:inline-block;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.06) inset;
        }
      }
    }
  }
}
</style>