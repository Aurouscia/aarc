import { createPinia, setActivePinia } from 'pinia'

/**
 * 为测试创建一个新的 Pinia 实例并设为 active
 * 每个测试开始前调用，确保 store 状态隔离
 */
export function createTestPinia() {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
