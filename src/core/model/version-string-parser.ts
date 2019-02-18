import { Either, left, right } from 'fp-ts/lib/Either';
import * as semver from 'semver';
import { ReleasedVersion, WipVersion } from './version';

export class ParseResult {
  public constructor(
    public readonly major: number,
    public readonly minor: number,
    public readonly patch: number,
    public readonly preRelease: string,
  ) {}

  public toWipVersion() {
    return WipVersion.of(this.major, this.minor, this.patch);
  }

  public toReleasedVersion() {
    return ReleasedVersion.of(this.major, this.minor, this.patch, this.preRelease);
  }
}

export class VersionStringParser {
  public parse(x: string): Either<Error, ParseResult> {
    if (semver.valid(x) === null) {
      return left(new Error(`invalid version string: ${x}`));
    }
    const result = new ParseResult(
      semver.major(x),
      semver.minor(x),
      semver.patch(x),
      (semver.prerelease(x) || []).join('.'),
    );
    return right(result);
  }
}

export const versionStringParser = new VersionStringParser();
