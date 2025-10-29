<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { ControlPoint } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';

const saveStore = useSaveStore();
const envStore = useEnvStore();
const cvs = useCvsFrameStore();

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
  }).slice(0, 80);
  return matched;
});

watch(searchText, (v)=>{
  showResults.value = !!v && v.trim().length > 0;
});

function centerOnPt(pt:ControlPoint){
  cvs.focusViewToPos(pt.pos)
  showResults.value = false;
  envStore.activePt = pt;
  envStore.cursorPos = [...pt.pos]
}

// 辅助：获取该站所属线路信息（name + color）
function getPtLines(pt:any){
  const lines = saveStore.getLinesByPt(pt.id) || [];
  return lines.map((l:any)=>({
    id: l.id,
    name: l.name || '',
    color: saveStore.getLineActualColorById(l.id) || l.color || '#000'
  }));
}
</script>

<template>
  <div class="searchStation">
    <input
      v-model="searchText"
      class="searchInput"
      placeholder="搜索站名或拼音（回车/下拉选择）"
      @keydown.enter.prevent="() => { if(results.length>0) centerOnPt(results[0]) }"
    />
    <div v-if="showResults" class="resultsPanel">
      <div v-if="results.length === 0" class="noRes">未发现该站点</div>
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
  display:flex;
  flex-direction:column;
  gap:6px;
  padding:8px;
  .searchInput{
    width: 100%;
    box-sizing: border-box;
    padding:8px 10px;
    border-radius:6px;
    border: 1px solid #ccc;
    font-size:14px;
    outline: none;
    &:focus{
      box-shadow: 0 0 0 3px rgba(100,150,255,0.12);
      border-color: #7aa7ff;
    }
  }
  .resultsPanel{
    margin-top:4px;
    width: min(50vw, 520px); /* 不超过页面一半 */
    max-height: 300px;
    overflow: auto;
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
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