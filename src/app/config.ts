export interface Config {
  versionPrefix: string;
  releaseBranchPrefix: string;
  masterBranch: string;
}

export const defaultConfig: Config = {
  versionPrefix: 'v',
  releaseBranchPrefix: 'release/',
  masterBranch: 'master',
};
