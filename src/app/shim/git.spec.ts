import { SimpleGit } from 'simple-git/promise';
import { ReadonlyGitClient, SimpleGitClient } from './git';

let inner: jest.Mocked<SimpleGit>;
let gitClient: SimpleGitClient;
let readonlyGitClient: ReadonlyGitClient;

beforeEach(() => {
  inner = jest.fn(() => ({
    tags: jest.fn(async () => undefined),
    branchLocal: jest.fn(async () => undefined),
    checkout: jest.fn(async () => undefined),
    checkoutBranch: jest.fn(async () => undefined),
    createBranch: jest.fn(async () => undefined),
    addTag: jest.fn(async () => undefined),
    merge: jest.fn(async () => undefined),
  }))();
  gitClient = new SimpleGitClient(inner);
  readonlyGitClient = new ReadonlyGitClient(inner);
});

describe('SimpleGitClient', () => {
  it('tags()', async () => {
    inner.tags.mockResolvedValue({ all: ['v1.0.0', 'v1.0.1'] });
    const rtn = await gitClient.tags().run();
    expect(rtn.value).toEqual(new Set(['v1.0.0', 'v1.0.1']));
  });

  it('localBranches()', async () => {
    inner.branchLocal.mockResolvedValue({ all: ['master', 'release/v1.2.3'] });
    const rtn = await gitClient.localBranches().run();
    expect(rtn.value).toEqual(new Set(['master', 'release/v1.2.3']));
  });

  it('checkout()', async () => {
    inner.checkout.mockResolvedValue(undefined);
    await gitClient.checkout('master').run();
    expect(inner.checkout).toHaveBeenCalledWith('master');
  });

  it('createBranch()', async () => {
    inner.checkoutBranch.mockResolvedValue(undefined);
    await gitClient.createBranch('release/v1.2.3', 'master').run();
    expect(inner.checkoutBranch).toHaveBeenCalledWith('release/v1.2.3', 'master');
  });

  it('createTag()', async () => {
    inner.addTag.mockResolvedValue(undefined);
    await gitClient.createTag('v1.2.3').run();
    expect(inner.addTag).toHaveBeenCalledWith('v1.2.3');
  });

  it('merge()', async () => {
    inner.merge.mockResolvedValue(undefined);
    await gitClient.merge('release/v1.2.3', '--no-ff').run();
    expect(inner.merge).toHaveBeenCalledWith(['release/v1.2.3', '--no-ff']);
  });
});

describe('ReadonlyGitClient', () => {
  it('checkout()', async () => {
    await readonlyGitClient.checkout().run();
    expect(inner.checkout).not.toHaveBeenCalled();
  });

  it('createBranch()', async () => {
    await readonlyGitClient.createBranch().run();
    expect(inner.checkoutBranch).not.toHaveBeenCalled();
  });

  it('createTag()', async () => {
    await readonlyGitClient.createTag().run();
    expect(inner.addTag).not.toHaveBeenCalled();
  });

  it('merge', async () => {
    await readonlyGitClient.merge().run();
    expect(inner.merge).not.toHaveBeenCalled();
  });
});
