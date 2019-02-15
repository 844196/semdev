import { ExecaStatic } from 'execa';
import { ExecaCommandRunner } from './command-runner';

let execa: jest.Mocked<ExecaStatic>;
let env: NodeJS.ProcessEnv;
let subject: ExecaCommandRunner;

beforeEach(() => {
  execa = jest.fn(() => {
    return {
      shell: jest.fn(async () => undefined),
    };
  })();
  env = { USER: 's083027' };
  subject = new ExecaCommandRunner(execa, env);
});

describe('ExecaCommandRunner', () => {
  describe('run()', () => {
    it('no env', async () => {
      await subject.run('pwd').run();
      expect(execa.shell).toHaveBeenCalledWith('pwd', { env: { USER: 's083027' } });
    });

    it('passed env', async () => {
      await subject.run('echo $MSG', { MSG: 'hi' }).run();
      expect(execa.shell).toHaveBeenCalledWith('echo $MSG', { env: { USER: 's083027', MSG: 'hi' } });
    });
  });
});
