import { fromIO } from 'fp-ts/lib/TaskEither';
import { ReleaseBranch } from '../../core/model/release-branch';
import { PrepareNextVersionPort } from '../../core/use-case/prepare-next-version';
import { Config, toStringerConfig } from '../config';
import { Git } from '../shim/git';
import { Logger } from '../shim/logger';
import { latestVersion } from './mixin/latest-version';

export class PrepareNextVersionAdapter implements PrepareNextVersionPort {
  public readonly notify: PrepareNextVersionPort['notify'] = {
    detectedLatest: (x) =>
      fromIO(this.logger.log('info', `detected latest version: ${x.toString(toStringerConfig(this.config))}`)),
    computedNext: (x) =>
      fromIO(this.logger.log('info', `compute next version: ${x.toString(toStringerConfig(this.config))}`)),
    createdBranch: (x) =>
      fromIO(this.logger.log('success', `create development branch: ${x.toString(toStringerConfig(this.config))}`)),
  };

  public constructor(private readonly config: Config, private readonly git: Git, private readonly logger: Logger) {}

  public latestVersion = latestVersion(this.git.tags.bind(this.git));

  public createBranch(branch: ReleaseBranch) {
    return this.git.createBranch(branch.toString(toStringerConfig(this.config)), this.config.masterBranch);
  }
}
