import { spawn } from 'child_process';
import { findLast, mapOption } from 'fp-ts/lib/Array';
import { toError } from 'fp-ts/lib/Either';
import { fromNullable } from 'fp-ts/lib/Option';
import { lookup } from 'fp-ts/lib/Record';
import { insert, toArray } from 'fp-ts/lib/Set';
import { fromIO, tryCatch } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { CLIHookAction } from '../../core/model/cli-hook-action';
import { ReleaseBranch } from '../../core/model/release-branch';
import { ordVersion, Version } from '../../core/model/version';
import { ReleaseVersionPort } from '../../core/use-case/release-version';
import { Config } from '../config';
import { Logger } from '../shim/logger';

export class ReleaseVersionAdapter implements ReleaseVersionPort {
  public readonly hooks: ReleaseVersionPort['hooks'];
  public readonly notify: ReleaseVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly logger: Logger,
  ) {
    const run = (cmd: string, env: Record<string, string> = {}) =>
      tryCatch<Error, void>(
        () =>
          new Promise((ok, ng) => {
            const p = spawn(cmd, { shell: true, env: { ...process.env, ...env } });
            p.stdout.on('data', (data) => this.logger.note(data.toString().trimRight()).run());
            p.on('close', (code) => (code === 0 ? ok() : ng(`command failed: ${cmd}`)));
          }),
        toError,
      ).chainFirst(fromIO(this.logger.complete(`exit: ${cmd}`)));
    const hookCmds = (t: 'pre' | 'post') =>
      lookup('release', config.hooks || {})
        .chain((x) => lookup(t, x || {}))
        .map((xs) => mapOption(xs || [], fromNullable))
        .map((xs) => xs.map((x) => new CLIHookAction(x, run, config.versionPrefix)))
        .getOrElse([]);
    this.hooks = {
      pre: hookCmds('pre'),
      post: hookCmds('post'),
    };

    const { releaseBranchPrefix: branchPrefix, versionPrefix } = this.config;
    this.notify = {
      merged: (x) => fromIO(this.logger.success(`merged: ${x.toString({ branchPrefix, versionPrefix })}`)),
      tagged: (x) => fromIO(this.logger.success(`tag created: ${x.toString({ versionPrefix })}`)),
      runHook: (x) => fromIO(this.logger.start(`run: ${x.inspect()}`)),
    };
  }

  public latestVersion() {
    return tryCatch(() => this.repository.tags(), toError)
      .map(({ all }) => all)
      .map((tags) =>
        tags.filter(Version.validString).reduce((xs, x) => {
          const v = Version.releasedFromString(x);
          return v.isRight() ? insert(ordVersion)(v.value, xs) : xs;
        }, new Set<Version>()),
      )
      .map(toArray(ordVersion))
      .map((xs) => findLast(xs, (x) => x.released).getOrElse(Version.initial()));
  }

  public mergeBranch(branch: ReleaseBranch) {
    const { releaseBranchPrefix: branchPrefix, versionPrefix, masterBranch } = this.config;
    const from = branch.toString({ branchPrefix, versionPrefix });
    const to = masterBranch;

    const checkout = tryCatch(() => this.repository.checkout(to), toError);
    const merge = tryCatch(() => this.repository.merge([from, '--no-ff']), toError);

    return checkout.chainSecond(merge).map(() => branch);
  }

  public createTag(version: Version) {
    const { versionPrefix, masterBranch } = this.config;
    const versionTag = version.toString({ versionPrefix });

    const checkout = tryCatch(() => this.repository.checkout(masterBranch), toError);
    const createTag = tryCatch(() => this.repository.addTag(versionTag), toError);

    return checkout.chainSecond(createTag).map(() => version);
  }
}
