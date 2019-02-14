import { right } from 'fp-ts/lib/Either';
import { fromEither } from 'fp-ts/lib/TaskEither';
import { Version } from '../../../core/model/version';
import { latestVersion } from './latest-version';

describe('latestVersion()', () => {
  it('exists', async () => {
    const tags = () => fromEither<Error, Set<string>>(right(new Set(['v1.0.0', 'v1.0.1-alpha.1', 'v1.0.1'])));

    const rtn = await latestVersion(tags)().run();
    expect(rtn.value).toEqual(Version.released(1, 0, 1));
  });

  it('not exists', async () => {
    const tags = () => fromEither<Error, Set<string>>(right(new Set([])));

    const rtn = await latestVersion(tags)().run();
    expect(rtn.value).toEqual(Version.initial());
  });
});
