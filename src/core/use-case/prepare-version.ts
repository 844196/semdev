import { ReleaseBranch } from '../model/release-branch';
import { ReleaseType } from '../model/release-type';
import { WipVersion } from '../model/version';
import { ConfigPort } from '../port/config-port';
import { GitPort } from '../port/git-port';
import { MessagePort, MessageType } from '../port/message-port';
import { computeLatestVersion } from './mixin/compute-latest-version';
import { releaseBranchAsString } from './mixin/stringer';

export class PrepareVersion {
  private readonly computeLatestVersion = computeLatestVersion(this.git);
  private readonly releaseBranchAsString = releaseBranchAsString(this.config);

  public constructor(
    private readonly config: ConfigPort,
    private readonly git: GitPort,
    private readonly message: MessagePort,
  ) {}

  public byReleaseType(releaseType: ReleaseType) {
    return this.computeLatestVersion().chain((latest) => this.byVersion(latest.increment(releaseType)));
  }

  public byVersion(version: WipVersion) {
    const branchName = this.releaseBranchAsString(ReleaseBranch.of(version));
    return this.git
      .createBranch(branchName, this.config.masterBranch())
      .chain(() => this.message.send(MessageType.SUCCESS, `create development branch: ${branchName}`));
  }
}
