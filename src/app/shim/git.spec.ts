import { SimpleGit } from 'simple-git/promise';
import { SimpleGitClient } from './git';

let inner: jest.Mocked<SimpleGit>;
let subject: SimpleGitClient;

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
  subject = new SimpleGitClient(inner);
});

describe('SimpleGitClient', () => {
  it('tags()', async () => {
    inner.tags.mockResolvedValue({ all: ['v1.0.0', 'v1.0.1'] });
    const rtn = await subject.tags().run();
    expect(rtn.value).toEqual(new Set(['v1.0.0', 'v1.0.1']));
  });

  it('localBranches()', async () => {
    inner.branchLocal.mockResolvedValue({ all: ['master', 'release/v1.2.3'] });
    const rtn = await subject.localBranches().run();
    expect(rtn.value).toEqual(new Set(['master', 'release/v1.2.3']));
  });

  it('checkout()', async () => {
    inner.checkout.mockResolvedValue(undefined);
    await subject.checkout('master').run();
    expect(inner.checkout).toHaveBeenCalledWith('master');
  });

  it('createBranch()', async () => {
    inner.checkoutBranch.mockResolvedValue(undefined);
    await subject.createBranch('release/v1.2.3', 'master').run();
    expect(inner.checkoutBranch).toHaveBeenCalledWith('release/v1.2.3', 'master');
  });

  it('createTag()', async () => {
    inner.addTag.mockResolvedValue(undefined);
    await subject.createTag('v1.2.3').run();
    expect(inner.addTag).toHaveBeenCalledWith('v1.2.3');
  });

  it('merge()', async () => {
    inner.merge.mockResolvedValue(undefined);
    await subject.merge('release/v1.2.3', '--no-ff').run();
    expect(inner.merge).toHaveBeenCalledWith(['release/v1.2.3', '--no-ff']);
  });
});
