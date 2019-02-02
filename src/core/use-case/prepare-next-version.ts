import { findLast } from 'fp-ts/lib/array';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Option } from 'fp-ts/lib/Option';
import { toArray } from 'fp-ts/lib/Set';
import { ReleaseType } from '../model/release-type';
import { ordVersion, Version } from '../model/version';

export interface PrepareNextVersionPort {
  fetchAllVersion(): Either<string, Set<Version>>;
  existsDevelopmentBranch(nextVersion: Version): Either<string, Option<string>>;
  createDevelopmentBranch(nextVersion: Version): Either<string, void>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public byReleaseType(releaseType: ReleaseType): Either<string, Version> {
    const computeNextVersion = this.port
      .fetchAllVersion()
      .map(toArray(ordVersion))
      .map((vers) => findLast(vers, (ver) => ver.released).getOrElse(Version.initial()))
      .map((latest) => latest.increment(releaseType));

    const checkCreatable = computeNextVersion.chain((next) =>
      this.port
        .existsDevelopmentBranch(next)
        .chain<Version>((branch) => (branch.isSome() ? left(`branch already exists: ${branch.value}`) : right(next))),
    );

    const createBranch = checkCreatable.chain((next) => this.port.createDevelopmentBranch(next).map(() => next));

    return createBranch;
  }
}
