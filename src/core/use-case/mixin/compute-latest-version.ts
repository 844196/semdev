import { last, mapOption, sort } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';
import { fromEither } from 'fp-ts/lib/Option';
import { initialVersion, ordVersion } from '../../model/version';
import { versionStringParser } from '../../model/version-string-parser';
import { GitPort } from '../../port/git-port';

export const computeLatestVersion = (git: GitPort) => () =>
  git.tags().map((tags) => {
    const vers = mapOption(tags, (s) => fromEither(versionStringParser.parse(s)).map((r) => r.toReleasedVersion()));
    const latest = pipe(
      sort(ordVersion),
      last,
    )(vers);
    return latest.getOrElse(initialVersion);
  });
