import { fromEither, TaskEither, taskEither } from 'fp-ts/lib/TaskEither';
import { CLIHookAction } from '../model/cli-hook-action';
import { ReleaseBranch } from '../model/release-branch';
import { Version } from '../model/version';
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
  mergeBranch(branch: ReleaseBranch): TaskEither<Error, ReleaseBranch>;
  createTag(version: Version): TaskEither<Error, Version>;
}

export class ReleaseVersion {
  public constructor(private readonly port: ReleaseVersionPort) {}

  public byVersion(version: Version) {
    const mergeBranch = fromEither(ReleaseBranch.of(version))
      .chain(this.port.mergeBranch.bind(this.port))
      .chain(this.port.notify.merged.bind(this.port));

    const createTag = this.port.createTag(version).chain(this.port.notify.tagged.bind(this.port));

    const chainedHooks = (type: 'pre' | 'post') => (latest: Version) =>
      this.port.hooks[type].reduce<TaskEither<Error, void>>(
        (acc, next) => acc.chain(() => this.port.notify.runHook(next)).chain(() => next.build(version, latest)),
        taskEither.of(undefined),
      );

    return this.port
      .latestVersion()
      .chain((latest) => chainedHooks('pre')(latest).map(() => latest))
      .chainFirst(mergeBranch.chainFirst(createTag))
      .chain((latest) => chainedHooks('post')(latest));
  }
}
