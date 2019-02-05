import { fromEither, TaskEither } from 'fp-ts/lib/TaskEither';
import { Version } from '../model/version';
import { VersionDevelopmentBranch } from '../model/version-development-branch';

export interface NotificationType {
  merged: VersionDevelopmentBranch;
  tagged: Version;
}

export interface ReleaseVersionPort {
  notify: { [K in keyof NotificationType]: (present: NotificationType[K]) => TaskEither<string, NotificationType[K]> };
  mergeBranch(branch: VersionDevelopmentBranch): TaskEither<string, VersionDevelopmentBranch>;
  createTag(version: Version): TaskEither<string, Version>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(version: Version) {
    return fromEither(VersionDevelopmentBranch.of(version))
      .chain(this.port.mergeBranch.bind(this.port))
      .chain(this.port.notify.merged.bind(this.port))
      .map((branch) => branch.version)
      .chain(this.port.createTag.bind(this.port))
      .chain(this.port.notify.tagged.bind(this.port));
  }
}
