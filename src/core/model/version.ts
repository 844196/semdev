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

  public static wip(major: number, minor: number, patch: number) {
    return new Version(major, minor, patch, '', false);
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

  public toString(prefix: string = '') {
    return `${prefix}${this.major}.${this.minor}.${this.patch}${
      this.preRelease.length > 0 ? `-${this.preRelease}` : ''
    }`;
  }
}

export const ordVersion: Ord<Version> = {
  equals: (x, y) => semver.eq(x.toString(), y.toString()),
  compare: (x, y) => {
    if (semver.eq(x.toString(), y.toString())) {
      return 0;
    }
    return semver.gt(x.toString(), y.toString()) ? 1 : -1;
  },
};
