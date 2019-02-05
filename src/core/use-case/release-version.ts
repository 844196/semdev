import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { Version } from '../model/version';

export interface NotificationType {
  merged: ReleaseBranch;
  tagged: Version;
}

export interface ReleaseVersionPort {
  notify: { [K in keyof NotificationType]: (present: NotificationType[K]) => TaskEither<string, NotificationType[K]> };
  mergeBranch(branch: ReleaseBranch): TaskEither<string, ReleaseBranch>;
  createTag(version: Version): TaskEither<string, Version>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(version: Version) {
    return fromEither(ReleaseBranch.of(version))
      .chain(this.port.mergeBranch.bind(this.port))
      .chain(this.port.notify.merged.bind(this.port))
      .map((branch) => branch.version)
      .chain(this.port.createTag.bind(this.port))
      .chain(this.port.notify.tagged.bind(this.port));
  }
}
