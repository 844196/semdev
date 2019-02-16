import { Ord } from 'fp-ts/lib/Ord';
import { Setoid } from 'fp-ts/lib/Setoid';
import * as semver from 'semver';
import { ReleaseType } from './release-type';

export abstract class Version {
  protected constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly preRelease: string,
  ) {}

  public abstract isReleased(): this is ReleasedVersion;

  public abstract isWip(): this is WipVersion;

  public increment(releaseType: ReleaseType) {
    switch (releaseType) {
      case ReleaseType.major:
        return WipVersion.of(this.major + 1, 0, 0);
      case ReleaseType.minor:
        return WipVersion.of(this.major, this.minor + 1, 0);
      case ReleaseType.patch:
        return WipVersion.of(this.major, this.minor, this.patch + 1);
    }
  }

  public toString({ versionPrefix }: VersionStringerConfig = { versionPrefix: '' }): VersionString {
    return `${versionPrefix}${this.major}.${this.minor}.${this.patch}${
      this.preRelease.length > 0 ? `-${this.preRelease}` : ''
    }` as VersionString;
  }
}

export class ReleasedVersion extends Version {
  public static of(major: number, minor: number, patch: number, preRelease: string = '') {
    return new ReleasedVersion(major, minor, patch, preRelease);
  }

  public static fromString(str: VersionString) {
    return new ReleasedVersion(
      semver.major(str),
      semver.minor(str),
      semver.patch(str),
      (semver.prerelease(str) || []).join('.'),
    );
  }

  public isReleased(): this is ReleasedVersion {
    return true;
  }

  public isWip(): this is WipVersion {
    return false;
  }
}

export class WipVersion extends Version {
  public static of(major: number, minor: number, patch: number) {
    return new WipVersion(major, minor, patch, '');
  }

  public static fromString(str: VersionString) {
    return new WipVersion(semver.major(str), semver.minor(str), semver.patch(str), '');
  }

  public isReleased(): this is ReleasedVersion {
    return false;
  }

  public isWip(): this is WipVersion {
    return true;
  }
}

export const setoidVersion: Setoid<Version> = {
  equals: (x, y) => x.isReleased() === y.isReleased() && semver.eq(x.toString(), y.toString()),
};
export const ordVersion: Ord<Version> = {
  ...setoidVersion,
  compare: (x, y) => (setoidVersion.equals(x, y) ? 0 : semver.gt(x.toString(), y.toString()) ? 1 : -1),
};

// see: https://basarat.gitbooks.io/typescript/docs/tips/nominalTyping.html
enum VersionStringBrand {}
export type VersionString = string & VersionStringBrand;
export const isVersionString = (x: string): x is VersionString => semver.valid(x) !== null;

export interface VersionStringerConfig {
  versionPrefix: string;
}

export const initialVersion: Version = WipVersion.of(0, 0, 0);
