import { array } from 'fp-ts/lib/Array';
import { sequence_ } from 'fp-ts/lib/Foldable2v';
import { taskEitherSeq } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../model/release-branch';
import { Version, WipVersion } from '../model/version';
import { ConfigPort } from '../port/config-port';
import { GitPort } from '../port/git-port';
import { MessagePort, MessageType } from '../port/message-port';
import { ShellPort } from '../port/shell-port';
import { computeLatestVersion } from './mixin/compute-latest-version';
import { releaseBranchAsString, versionAsString } from './mixin/stringer';

export class ReleaseVersion {
  private readonly computeLatestVersion = computeLatestVersion(this.git);
  private readonly versionAsString = versionAsString(this.config);
  private readonly releaseBranchAsString = releaseBranchAsString(this.config);

  public constructor(
    private readonly config: ConfigPort,
    private readonly git: GitPort,
    private readonly message: MessagePort,
    private readonly shell: ShellPort,
  ) {}

  public byVersion(targetVersion: WipVersion) {
    const runHooks = (type: 'pre' | 'post', next: Version, prev: Version) => {
      const env = {
        NEXT_VERSION: this.versionAsString(next),
        PREV_VERSION: this.versionAsString(prev),
      };
      const cmds = this.config.hooks('release')[type].map((cmd) => {
        return this.message
          .send(MessageType.START, cmd)
          .chain(() => this.shell.runCommand(cmd, env))
          .chain(() => this.message.send(MessageType.COMPLETE, cmd));
      });
      return sequence_(taskEitherSeq, array)(cmds);
    };

    const merge = (branch: ReleaseBranch) => {
      const branchName = this.releaseBranchAsString(branch);
      return this.git
        .checkout(this.config.masterBranch())
        .chain(() => this.git.merge(branchName, '--no-ff'))
        .chain(() => this.message.send(MessageType.SUCCESS, `branch merged: ${branchName}`));
    };

    const createTag = (version: Version) => {
      const tagName = this.versionAsString(version);
      return this.git.createTag(tagName).chain(() => this.message.send(MessageType.SUCCESS, `tag created: ${tagName}`));
    };

    return this.computeLatestVersion().chain((prevVersion) =>
      runHooks('pre', targetVersion, prevVersion)
        .chain(() => merge(ReleaseBranch.of(targetVersion)))
        .chain(() => createTag(targetVersion))
        .chain(() => runHooks('post', targetVersion, prevVersion)),
    );
  }
}
