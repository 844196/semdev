import { Ord } from 'fp-ts/lib/Ord';
import * as semver from 'semver';
import { ReleaseType } from './release-type';

export class Version {
  private constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly preRelease: string,
    public readonly released: boolean,
  ) {}

  public static initial() {
    return new Version(0, 0, 0, '', false);
  }

  public static released(major: number, minor: number, patch: number, preRelease: string = '') {
    return new Version(major, minor, patch, preRelease, true);
  }

  public static releasedFromString(str: string) {
    if (!semver.valid(str)) {
      throw new InvalidVersionStringError(`given: ${str}`);
    }
    return Version.released(
      semver.major(str),
      semver.minor(str),
      semver.patch(str),
      (semver.prerelease(str) || []).join('.'),
    );
  }

  public static wip(major: number, minor: number, patch: number) {
    return new Version(major, minor, patch, '', false);
  }

  public static wipFromString(str: string) {
    if (!semver.valid(str)) {
      throw new InvalidVersionStringError(`given: ${str}`);
    }
    return Version.wip(semver.major(str), semver.minor(str), semver.patch(str));
  }

  public get wip() {
    return !this.released;
  }

  public increment(releaseType: ReleaseType) {
    switch (releaseType) {
      case ReleaseType.major:
        return new Version(this.major + 1, 0, 0, '', false);
      case ReleaseType.minor:
        return new Version(this.major, this.minor + 1, 0, '', false);
      case ReleaseType.patch:
        return new Version(this.major, this.minor, this.patch + 1, '', false);
    }
  }

  public equals(other: Version) {
    if (this.released !== other.released) {
      return false;
    }
    return semver.eq(this.toString(), other.toString());
  }

  public greaterThan(other: Version) {
    return semver.gt(this.toString(), other.toString());
  }

  public toString({ versionPrefix }: { versionPrefix: string } = { versionPrefix: '' }) {
    return `${versionPrefix}${this.major}.${this.minor}.${this.patch}${
      this.preRelease.length > 0 ? `-${this.preRelease}` : ''
    }`;
  }
}

export class InvalidVersionStringError extends Error {}

export const ordVersion: Ord<Version> = {
  equals: (x, y) => x.equals(y),
  compare: (x, y) => (x.equals(y) ? 0 : x.greaterThan(y) ? 1 : -1),
};
