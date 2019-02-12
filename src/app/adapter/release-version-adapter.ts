import { right, toError } from 'fp-ts/lib/Either';
import { fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { ReleaseBranch } from '../../core/model/release-branch';
import { Version } from '../../core/model/version';
import { ReleaseVersionPort } from '../../core/use-case/release-version';
import { Config } from '../config';

export class ReleaseVersionAdapter implements ReleaseVersionPort {
  public readonly notify: ReleaseVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly signale: Record<Extract<DefaultMethods, 'success'>, LoggerFunc>,
  ) {
    const tap = <T>(f: (t: T) => void) => (t: T) => {
      f(t);
      return fromEither<Error, T>(right(t));
    };
    const { releaseBranchPrefix, versionPrefix } = this.config;
    this.notify = {
      merged: tap((_) =>
        this.signale.success(`merged: ${_.toString({ branchPrefix: releaseBranchPrefix, versionPrefix })}`),
      ),
      tagged: tap((_) => this.signale.success(`version tag created: ${_.toString({ versionPrefix })}`)),
    };
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
