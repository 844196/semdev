import { TaskEither } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { Version, WipVersion } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  merged: ReleaseBranch;
  tagged: Version;
}

export interface ReleaseVersionPort extends NotifiablePort<NotificationType> {
  runHooks(timing: 'pre' | 'post', next: Version, prev: Version): TaskEither<Error, void>;
  latestVersion(): TaskEither<Error, Version>;
  mergeBranch(branch: ReleaseBranch): TaskEither<Error, void>;
  createTag(version: Version): TaskEither<Error, void>;
  ensureReleasable(version: WipVersion): TaskEither<Error, void>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(targetVersion: WipVersion) {
    const mergeBranch = (b: ReleaseBranch) => this.port.mergeBranch(b).chain(() => this.port.notify.merged(b));
    const createTag = (v: Version) => this.port.createTag(v).chain(() => this.port.notify.tagged(v));

    return this.port
      .ensureReleasable(targetVersion)
      .chain(() => this.port.latestVersion())
      .chain((prevVersion) => {
        return this.port
          .runHooks('pre', targetVersion, prevVersion)
          .chain(() => mergeBranch(ReleaseBranch.of(targetVersion)))
          .chain(() => createTag(targetVersion))
          .chain(() => this.port.runHooks('post', targetVersion, prevVersion));
      });
  }
}
