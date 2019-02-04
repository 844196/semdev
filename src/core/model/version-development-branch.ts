import { Version } from './version';

export class VersionDevelopmentBranch {
  private constructor(private readonly version: Version) {}

  public static of(version: Version) {
    // TODO: return Either<string, VersionDevelopmentBranch>
    if (version.released) {
      throw new Error(`given version was already released: ${version.toString()}`);
    }
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
