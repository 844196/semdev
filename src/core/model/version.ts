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
    return Version.wip(0, 0, 0);
  }

  public static released(major: number, minor: number, patch: number, preRelease: string = ''): ReleasedVersion {
    return new Version(major, minor, patch, preRelease, true) as ReleasedVersion;
  }

  public static releasedFromString(str: VersionString) {
    return Version.released(
      semver.major(str),
      semver.minor(str),
      semver.patch(str),
      (semver.prerelease(str) || []).join('.'),
    );
  }

  public static wip(major: number, minor: number, patch: number): WipVersion {
    return new Version(major, minor, patch, '', false) as WipVersion;
  }

  public static wipFromString(str: VersionString) {
    return Version.wip(semver.major(str), semver.minor(str), semver.patch(str));
  }

  public get wip() {
    return !this.released;
  }

  public increment(releaseType: ReleaseType) {
    switch (releaseType) {
      case ReleaseType.major:
        return Version.wip(this.major + 1, 0, 0);
      case ReleaseType.minor:
        return Version.wip(this.major, this.minor + 1, 0);
      case ReleaseType.patch:
        return Version.wip(this.major, this.minor, this.patch + 1);
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

  public toString({ versionPrefix }: VersionStringerConfig = { versionPrefix: '' }): VersionString {
    return `${versionPrefix}${this.major}.${this.minor}.${this.patch}${
      this.preRelease.length > 0 ? `-${this.preRelease}` : ''
    }` as VersionString;
  }
}

export const ordVersion: Ord<Version> = {
  equals: (x, y) => x.equals(y),
  compare: (x, y) => (x.equals(y) ? 0 : x.greaterThan(y) ? 1 : -1),
};

// see: https://basarat.gitbooks.io/typescript/docs/tips/nominalTyping.html
enum VersionStringBrand {}
export type VersionString = string & VersionStringBrand;
export const isVersionString = (x: string): x is VersionString => semver.valid(x) !== null;

export interface VersionStringerConfig {
  versionPrefix: string;
}

export type WipVersion = Version & {
  released: false;
  wip: true;
};
export const isWipVersion = (x: Version): x is WipVersion => x.released === false && x.wip === true;

export type ReleasedVersion = Version & {
  released: true;
  wip: false;
};
export const isReleasedVersion = (x: Version): x is ReleasedVersion => x.released === true && x.wip === false;
