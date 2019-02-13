import { Either, toError } from 'fp-ts/lib/Either';
import { insert, union } from 'fp-ts/lib/Set';
import { fromIO, tryCatch } from 'fp-ts/lib/TaskEither';
import { SimpleGit } from 'simple-git/promise';
import { ReleaseBranch } from '../../core/model/release-branch';
import { ordVersion, Version } from '../../core/model/version';
import { PrepareNextVersionPort } from '../../core/use-case/prepare-next-version';
import { Config } from '../config';
import { Logger } from '../shim/logger';

export class PrepareNextVersionAdapter implements PrepareNextVersionPort {
  public readonly notify: PrepareNextVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly logger: Logger,
  ) {
    const { releaseBranchPrefix: branchPrefix, versionPrefix } = this.config;
    this.notify = {
      detectedLatest: (x) => fromIO(this.logger.info(`detected latest version: ${x.toString(this.config)}`)),
      computedNext: (x) => fromIO(this.logger.info(`compute next version: ${x.toString(this.config)}`)),
      createdBranch: (x) =>
        fromIO(this.logger.success(`create development branch: ${x.toString({ branchPrefix, versionPrefix })}`)),
    };
  }

  public fetchAllVersion() {
    const verIntoSet = (v: Either<Error, Version>, vs: Set<Version>) =>
      v.isRight() ? insert(ordVersion)(v.value, vs) : vs;
    const releasedVersions = tryCatch(() => this.repository.tags(), toError)
      .map(({ all }) => all)
      .map((tags) =>
        tags
          .filter(Version.validString)
          .reduce((xs, x) => verIntoSet(Version.releasedFromString(x), xs), new Set<Version>()),
      );
    const wipVersions = tryCatch(() => this.repository.branchLocal(), toError)
      .map(({ all }) => all)
      .map((branches) =>
        branches
          .map((x) => x.replace(new RegExp(String.raw`^${this.config.releaseBranchPrefix}`), ''))
          .filter(Version.validString)
          .reduce((xs, x) => verIntoSet(Version.wipFromString(x), xs), new Set<Version>()),
      );
    return releasedVersions.chain((x) => wipVersions.map((y) => union(ordVersion)(x, y)));
  }

  public checkoutBranch(branch: ReleaseBranch) {
    const { releaseBranchPrefix, versionPrefix } = this.config;
    return tryCatch(
      () =>
        this.repository.checkoutBranch(
          branch.toString({ branchPrefix: releaseBranchPrefix, versionPrefix }),
          this.config.masterBranch,
        ),
      toError,
    ).map(() => branch);
  }
}
