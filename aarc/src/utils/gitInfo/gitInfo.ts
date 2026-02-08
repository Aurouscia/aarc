export interface GitInfo {
    branchName: string;
    commitId: string;
    contributors: Array<{
      name: string;
      count: number;
    }>;
    builtAt: string;
}