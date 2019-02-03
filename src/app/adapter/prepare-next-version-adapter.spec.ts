import { none, some } from 'fp-ts/lib/Option';
import { DefaultMethods, LoggerFunc } from 'signale';
import { SimpleGit } from 'simple-git/promise';
import { Version } from '../../core/model/version';
import { Config } from '../config';
import { PrepareNextVersionAdapter } from './prepare-next-version-adapter';

const config: Config = {
  versionPrefix: 'v',
  branchPrefix: 'release/',
  mainStreamBranch: 'master',
};
let simpleGit: jest.Mocked<SimpleGit>;
let adapter: PrepareNextVersionAdapter;
let signale: jest.Mocked<Record<Extract<DefaultMethods, 'success' | 'info'>, LoggerFunc>>;

beforeEach(() => {
  simpleGit = jest.fn(
    (): Pick<SimpleGit, 'branchLocal' | 'tags' | 'checkoutBranch'> => {
      return {
        branchLocal: jest.fn(),
        tags: jest.fn(),
        checkoutBranch: jest.fn(),
      };
    },
  )();
  signale = jest.fn(() => ({ success: jest.fn(() => undefined), info: jest.fn(() => undefined) }))();
  adapter = new PrepareNextVersionAdapter(config, simpleGit, signale);
});

describe('PrepareNextVersionAdapter', () => {
  it('fetchAllVersion()', async () => {
    simpleGit.branchLocal.mockResolvedValue({ all: ['master', 'release/v1.1.0', 'release/v2.0.0'] });
    simpleGit.tags.mockResolvedValue({ all: ['v1.0.0', 'v1.0.1-alpha.1', 'v1.0.1'] });

    const rtn = await adapter.fetchAllVersion().run();
    expect(rtn.value).toEqual(
      new Set([
        Version.wip(1, 1, 0),
        Version.wip(2, 0, 0),
        Version.released(1, 0, 0),
        Version.released(1, 0, 1, 'alpha.1'),
        Version.released(1, 0, 1),
      ]),
    );
    expect(simpleGit.branchLocal).toHaveBeenCalled();
    expect(simpleGit.tags).toHaveBeenCalled();
  });

  it('existsDevelopmentBranch()', async () => {
    simpleGit.branchLocal.mockResolvedValue({ all: ['master', 'release/v1.1.0', 'release/v2.0.0'] });

    const rtn1 = await adapter.existsDevelopmentBranch(Version.wip(1, 1, 0)).run();
    expect(rtn1.value).toEqual(some('release/v1.1.0'));
    const rtn2 = await adapter.existsDevelopmentBranch(Version.wip(1, 0, 2)).run();
    expect(rtn2.value).toEqual(none);
  });

  it('createDevelopmentBranch()', async () => {
    simpleGit.checkoutBranch.mockResolvedValue(undefined);
    const rtn = await adapter.createDevelopmentBranch(Version.wip(1, 1, 0)).run();
    expect(rtn.value).toBe('release/v1.1.0');
    expect(simpleGit.checkoutBranch).toHaveBeenCalledWith('release/v1.1.0', 'master');
  });
});
