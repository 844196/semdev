import { array } from 'fp-ts/lib/Array';
import { sequence_ } from 'fp-ts/lib/Foldable2v';
import { TaskEither, taskEitherSeq } from 'fp-ts/lib/TaskEither';
import { CLIHookAction } from '../model/cli-hook-action';
import { ReleaseBranch } from '../model/release-branch';
import { Version, WipVersion } from '../model/version';
import { NotifiablePort } from './notifiable-port';

interface NotificationType {
  merged: ReleaseBranch;
  tagged: Version;
  runHook: CLIHookAction;
}

export interface ReleaseVersionPort extends NotifiablePort<NotificationType> {
  hooks: {
    pre: CLIHookAction[];
    post: CLIHookAction[];
  };
  latestVersion(): TaskEither<Error, Version>;
  mergeBranch(branch: ReleaseBranch): TaskEither<Error, void>;
  createTag(version: Version): TaskEither<Error, void>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(targetVersion: WipVersion) {
    const mergeBranch = (b: ReleaseBranch) => this.port.mergeBranch(b).chain(() => this.port.notify.merged(b));
    const createTag = (v: Version) => this.port.createTag(v).chain(() => this.port.notify.tagged(v));

    return this.port.latestVersion().chain((prevVersion) => {
      const sequenceHook = (type: 'pre' | 'post') =>
        sequence_(taskEitherSeq, array)(this.port.hooks[type].map((h) => h.build(targetVersion, prevVersion)));
      return sequenceHook('pre')
        .chain(() => mergeBranch(ReleaseBranch.of(targetVersion)))
        .chain(() => createTag(targetVersion))
        .chain(() => sequenceHook('post'));
    });
  }
}
