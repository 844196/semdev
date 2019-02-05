import { Either, left, right } from 'fp-ts/lib/Either';
import { Version } from './version';

export class VersionDevelopmentBranch {
  private constructor(public readonly version: Version) {}

  public static of(version: Version): Either<string, VersionDevelopmentBranch> {
    return version.wip
      ? right(new VersionDevelopmentBranch(version))
      : left(`given version was already released: ${version.toString()}`);
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
