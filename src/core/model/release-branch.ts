import { Either, left, right } from 'fp-ts/lib/Either';
import { Version } from './version';

export class ReleaseBranch {
  private constructor(public readonly version: Version) {}

  public static of(version: Version): Either<string, ReleaseBranch> {
    return version.wip
      ? right(new ReleaseBranch(version))
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
