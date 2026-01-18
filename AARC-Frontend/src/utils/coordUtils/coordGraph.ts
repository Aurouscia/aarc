import { Coord } from "@/models/coord";

interface Edge {
  a: Coord;
  b: Coord;
  len: number;
}

/**
 * 构造连通、密度可调的网格
 * @param coords   输入点
 * @param maxDist  最大考虑距离（可视范围/密度上限）
 * @param density  0~1 的密度旋钮
 */
export function buildConnectedGraph(
  coords: Coord[],
  maxDist: number,
  density = 0.5
): [Coord, Coord][] {
  const n = coords.length;
  if (n <= 1) return [];

  // 1. 预处理所有候选边，按长度升序
  const edges: Edge[] = [];
  const maxD2 = maxDist * maxDist;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = coords[i];
    for (let j = i + 1; j < n; j++) {
      const [bx, by] = coords[j];
      const dx = ax - bx;
      const dy = ay - by;
      const d2 = dx * dx + dy * dy;
      if (!maxD2 || d2 <= maxD2) edges.push({ a: coords[i], b: coords[j], len: Math.sqrt(d2) });
    }
  }
  edges.sort((e1, e2) => e1.len - e2.len);

  // 2. 并查集
  const fa = Array.from({ length: n }, (_, i) => i);
  function find(u: number): number {
    return fa[u] === u ? u : (fa[u] = find(fa[u]));
  }
  function union(u: number, v: number) {
    fa[find(u)] = find(v);
  }

  // 3. Kruskal 求 MST
  const mst: Edge[] = [];
  for (const e of edges) {
    const u = coords.indexOf(e.a);
    const v = coords.indexOf(e.b);
    if (find(u) !== find(v)) {
      union(u, v);
      mst.push(e);
      if (mst.length === n - 1) break;
    }
  }

  // 4. 按密度追加冗余边
  const targetCount = Math.round(
    mst.length + density * (edges.length - mst.length)
  );
  const used = new Set(mst);
  let idx = 0;
  while (used.size < targetCount && idx < edges.length) {
    const e = edges[idx++];
    if (!used.has(e)) used.add(e);
  }

  return Array.from(used).map(x => [x.a, x.b]);
}