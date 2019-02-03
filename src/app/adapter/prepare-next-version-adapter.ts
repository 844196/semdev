import { findFirst } from 'fp-ts/lib/array';
import { right } from 'fp-ts/lib/Either';
import { union } from 'fp-ts/lib/Set';
import { fromEither, tryCatch } from 'fp-ts/lib/TaskEither';
import * as semver from 'semver';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { ordVersion, Version } from '../../core/model/version';
import { PrepareNextVersionPort } from '../../core/use-case/prepare-next-version';
import { Config } from '../config';

const releasedVersionFromString = (x: string) =>
  Version.released(semver.major(x), semver.minor(x), semver.patch(x), (semver.prerelease(x) || []).join('.'));
const wipVersionFromString = (x: string) => Version.wip(semver.major(x), semver.minor(x), semver.patch(x));

export class PrepareNextVersionAdapter implements PrepareNextVersionPort {
  public readonly notify: PrepareNextVersionPort['notify'];

  public constructor(
    private readonly config: Config,
    private readonly repository: SimpleGit,
    private readonly signale: Record<Extract<DefaultMethods, 'success' | 'info'>, LoggerFunc>,
  ) {
    const tap = <T>(f: (t: T) => void) => (t: T) => {
      f(t);
      return fromEither<string, T>(right(t));
    };
    const { versionPrefix } = this.config;
    this.notify = {
      computedNext: tap((_) => this.signale.info(`detected latest version: ${_.toString(versionPrefix)}`)),
      detectedLatest: tap((_) => this.signale.info(`compute next version: ${_.toString(versionPrefix)}`)),
      createdBranch: tap((_) => this.signale.success(`create development branch: ${_}`)),
    };
  }

  public fetchAllVersion() {
    const releasedVersions = tryCatch(() => this.repository.tags(), String)
      .map(({ all }) => all)
      .map((tags) =>
        tags.filter((x) => semver.valid(x)).reduce((xs, x) => xs.add(releasedVersionFromString(x)), new Set<Version>()),
      );
    const wipVersions = tryCatch(() => this.repository.branchLocal(), String)
      .map(({ all }) => all)
      .map((branches) =>
        branches
          .map((x) => x.replace(/^release\//, ''))
          .filter((x) => semver.valid(x))
          .reduce((xs, x) => xs.add(wipVersionFromString(x)), new Set<Version>()),
      );
    return releasedVersions.chain((x) => wipVersions.map((y) => union(ordVersion)(x, y)));
  }

  public existsDevelopmentBranch(version: Version) {
    return tryCatch(() => this.repository.branchLocal(), String)
      .map(({ all }) => all)
      .map((branches) => findFirst(branches, (x) => x === this.toBranchName(version)));
  }

  public createDevelopmentBranch(version: Version) {
    const { mainStreamBranch } = this.config;
    const branchName = this.toBranchName(version);
    return tryCatch(() => this.repository.checkoutBranch(branchName, mainStreamBranch), String).map(() => branchName);
  }

  private toBranchName(version: Version) {
    const { branchPrefix, versionPrefix } = this.config;
    return `${branchPrefix}${version.toString(versionPrefix)}`;
  }
}
