import { Version } from './version';

export class VersionDevelopmentBranch {
  private constructor(private readonly version: Version) {}

  public static of(version: Version) {
    return new VersionDevelopmentBranch(version);
  }

  public toString(
    { branchPrefix, versionPrefix }: { branchPrefix: string; versionPrefix: string } = {
      branchPrefix: '',
      versionPrefix: '',
    },
  ) {
    return `${branchPrefix}${this.version.toString({ versionPrefix })}`;
  }
}
