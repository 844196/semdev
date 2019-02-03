import { findFirst } from 'fp-ts/lib/array';
import { union } from 'fp-ts/lib/Set';
import { tryCatch } from 'fp-ts/lib/TaskEither';
import * as semver from 'semver';
import { SimpleGit } from 'simple-git/promise';
import { ordVersion, Version } from '../../core/model/version';
import { PrepareNextVersionPort } from '../../core/use-case/prepare-next-version';
import { Config } from '../config';

const releasedVersionFromString = (x: string) =>
  Version.released(semver.major(x), semver.minor(x), semver.patch(x), (semver.prerelease(x) || []).join('.'));
const wipVersionFromString = (x: string) => Version.wip(semver.major(x), semver.minor(x), semver.patch(x));

export class PrepareNextVersionAdapter implements PrepareNextVersionPort {
  public constructor(private readonly config: Config, private readonly repository: SimpleGit) {}

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
      .map((branches) =>
        findFirst(branches, (x) => x === `${this.config.branchPrefix}${version.toString(this.config.versionPrefix)}`),
      );
  }

  public createDevelopmentBranch(version: Version) {
    return tryCatch(
      () =>
        this.repository.checkoutBranch(
          `${this.config.branchPrefix}${version.toString(this.config.versionPrefix)}`,
          this.config.mainStreamBranch,
        ),
      String,
    );
  }
}
