import { VersionStringerConfig, WipVersion } from './version';

export class ReleaseBranch {
  private constructor(public readonly version: WipVersion) {}

  public static of(version: WipVersion): ReleaseBranch {
    return new ReleaseBranch(version);
  }

  public toString(
    { branchPrefix, versionPrefix }: ReleaseBranchStringerConfig = {
      branchPrefix: '',
      versionPrefix: '',
    },
  ) {
    return `${branchPrefix}${this.version.toString({ versionPrefix })}`;
  }
}

export interface ReleaseBranchStringerConfig extends VersionStringerConfig {
  branchPrefix: string;
}
