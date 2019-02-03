import { ReleaseType } from '../../core/model/release-type';
import { PrepareNextVersion } from '../../core/use-case/prepare-next-version';
import { PrepareCommand } from './prepare';

let useCase: jest.Mocked<PrepareNextVersion>;
let command: PrepareCommand;

beforeEach(() => {
  useCase = jest.fn(
    (): Pick<PrepareNextVersion, 'byReleaseType'> => {
      return {
        byReleaseType: jest.fn(),
      };
    },
  )();
  command = new PrepareCommand(useCase);
});

describe('PrepareCommand', () => {
  describe('run()', () => {
    it('invalid release type given', async () => {
      const rtn = await command.run('foo').run();
      expect(rtn.value).toBe('invalid release type given: foo');
    });

    it('valid release type given', async () => {
      const taskEither = {};
      useCase.byReleaseType.mockReturnValue(taskEither);

      const rtn = await command.run(ReleaseType.major);
      expect(useCase.byReleaseType).toHaveBeenCalledWith(ReleaseType.major);
      expect(rtn).toBe(taskEither);
    });
  });
});
