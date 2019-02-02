import { findLast } from 'fp-ts/lib/array';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Option } from 'fp-ts/lib/Option';
import { toArray } from 'fp-ts/lib/Set';
import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseType } from '../model/release-type';
import { ordVersion, Version } from '../model/version';

export interface PrepareNextVersionPort {
  fetchAllVersion(): TaskEither<string, Set<Version>>;
  existsDevelopmentBranch(nextVersion: Version): TaskEither<string, Option<string>>;
  createDevelopmentBranch(nextVersion: Version): TaskEither<string, void>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public async byReleaseType(releaseType: ReleaseType): Promise<Either<string, Version>> {
    const computeNextVersion = this.port
      .fetchAllVersion()
      .map(toArray(ordVersion))
      .map((vers) => findLast(vers, (ver) => ver.released).getOrElse(Version.initial()))
      .map((latest) => latest.increment(releaseType));

    const checkCreatable = computeNextVersion.chain((next) =>
      this.port
        .existsDevelopmentBranch(next)
        .chain<Version>((branch) =>
          branch.isSome() ? fromEither(left(`branch already exists: ${branch.value}`)) : fromEither(right(next)),
        ),
    );

    const createBranch = checkCreatable.chain((next) => this.port.createDevelopmentBranch(next).map(() => next));

    return createBranch.run();
  }
}
