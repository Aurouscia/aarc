import { GitInfo } from "./gitInfoGen";

// 缓存变量，用于存储第一次获取的数据
let cachedGitInfo: GitInfo | null = null;

/**
 * 获取git信息的函数（实现懒加载功能）
 * @returns Promise<GitInfo> git信息对象
 * @description 该函数会在第一次调用时从/public/gitInfo.json获取数据并缓存，
 * 后续调用直接返回缓存数据，避免重复请求
 */
export const getGitInfo = async (): Promise<GitInfo> => {
  // 检查是否已有缓存数据
  if (cachedGitInfo) {
    return cachedGitInfo;
  }

  try {
    // 使用fetch获取gitInfo.json，设置cache: 'no-store'避免浏览器缓存
    const response = await fetch('/gitInfo.json', {
      method: 'GET',
      cache: 'no-store', // 不使用缓存
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 解析JSON数据
    const gitInfo: GitInfo = await response.json();

    // 缓存数据
    cachedGitInfo = gitInfo;

    return gitInfo;
  } catch (error) {
    console.error('获取git信息失败:', error);
    return {
      commitId: '获取失败',
      branchName: '获取失败',
      contributors: [{"name": "获取失败", "count": 0}],
      builtAt: '获取失败'
    }
  }
};

// 提供一个清除缓存的函数，便于在需要时强制刷新数据
export const clearGitInfoCache = (): void => {
  cachedGitInfo = null;
};