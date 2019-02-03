import { findLast } from 'fp-ts/lib/array';
import { left, right } from 'fp-ts/lib/Either';
import { Option } from 'fp-ts/lib/Option';
import { toArray } from 'fp-ts/lib/Set';
import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseType } from '../model/release-type';
import { ordVersion, Version } from '../model/version';

export interface NotificationType {
  detectedLatest: Version;
  computedNext: Version;
  createdBranch: string;
}

export interface PrepareNextVersionPort {
  notify: { [K in keyof NotificationType]: (present: NotificationType[K]) => TaskEither<string, NotificationType[K]> };
  fetchAllVersion(): TaskEither<string, Set<Version>>;
  existsDevelopmentBranch(nextVersion: Version): TaskEither<string, Option<string>>;
  createDevelopmentBranch(nextVersion: Version): TaskEither<string, string>;
}

export class PrepareNextVersion {
  public constructor(private readonly port: PrepareNextVersionPort) {}

  public byReleaseType(releaseType: ReleaseType) {
    const computeNextVersion = this.port
      .fetchAllVersion()
      .map(toArray(ordVersion))
      .map((vers) => findLast(vers, (ver) => ver.released).getOrElse(Version.initial()))
      .chain((latest) => this.port.notify.detectedLatest(latest))
      .map((latest) => latest.increment(releaseType))
      .chain((next) => this.port.notify.computedNext(next));

    const checkCreatable = computeNextVersion.chain((next) =>
      this.port
        .existsDevelopmentBranch(next)
        .chain<Version>((branch) =>
          branch.isSome() ? fromEither(left(`branch already exists: ${branch.value}`)) : fromEither(right(next)),
        ),
    );

    const createBranch = checkCreatable
      .chain((next) => this.port.createDevelopmentBranch(next))
      .chain((branchName) => this.port.notify.createdBranch(branchName));

    return createBranch;
  }
}
