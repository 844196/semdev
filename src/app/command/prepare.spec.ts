import { ReleaseType } from '../../core/model/release-type';
import { Version } from '../../core/model/version';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';
import { PrepareCommand } from './prepare';

let useCase: jest.Mocked<PrepareNextVersion>;
let command: PrepareCommand;

beforeEach(() => {
  useCase = jest.fn(
    (): Pick<PrepareNextVersion, 'byReleaseType' | 'byVersion'> => {
      return {
        byReleaseType: jest.fn(),
        byVersion: jest.fn(),
      };
    },
  )();
  command = new PrepareCommand(useCase);
});

describe('PrepareCommand', () => {
  describe('run()', () => {
    it('invalid release type given', async () => {
      const rtn = await command.run('foo').run();
      expect(rtn.value).toBe('invalid release type or version given: foo');
    });

    it('valid release type given', async () => {
      const taskEither = {};
      useCase.byReleaseType.mockReturnValue(taskEither);

      const rtn = await command.run(ReleaseType.major);
      expect(useCase.byReleaseType).toHaveBeenCalledWith(ReleaseType.major);
      expect(rtn).toBe(taskEither);
    });

    it('valid version given', async () => {
      const taskEither = {};
      useCase.byVersion.mockReturnValue(taskEither);

      const rtn = await command.run('1.2.3');
      expect(useCase.byVersion).toHaveBeenCalledWith(Version.wip(1, 2, 3));
      expect(rtn).toBe(taskEither);
    });
  });
});
