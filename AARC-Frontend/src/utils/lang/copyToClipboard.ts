import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
const uniq = useUniqueComponentsStore()
export function copyToClipboard(text: string): void {
  //http环境用这种方法
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // 避免触发滚动
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const success = document.execCommand('copy');
    if (success) {
      uniq.pop?.show(`复制成功，共${text.length}字`, 'success')
    } else {
      uniq.pop?.show('复制失败', 'failed')
    }
  } catch (err) {
      uniq.pop?.show('复制失败', 'failed')
  } finally {
    document.body.removeChild(textarea);
  }
}