export interface ConfigPort {
  masterBranch(): string;
  releaseBranchPrefix(): string;
  versionPrefix(): string;
  hooks(
    type: 'prepare' | 'release',
  ): {
    pre: string[];
    post: string[];
  };
}
