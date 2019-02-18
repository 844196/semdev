import { ExecaStatic } from 'execa';
import { EmptyCommandRunner, ExecaCommandRunner } from './command-runner';

let execa: jest.Mocked<ExecaStatic>;
let env: NodeJS.ProcessEnv;
let execaCommandRunner: ExecaCommandRunner;
let emptyCommandRunner: EmptyCommandRunner;

beforeEach(() => {
  execa = jest.fn(() => {
    return {
      shell: jest.fn(async () => undefined),
    };
  })();
  env = { USER: 's083027' };
  execaCommandRunner = new ExecaCommandRunner(execa, env);
  emptyCommandRunner = new EmptyCommandRunner();
});

describe('ExecaCommandRunner', () => {
  describe('run()', () => {
    it('no env', async () => {
      await execaCommandRunner.run('pwd').run();
      expect(execa.shell).toHaveBeenCalledWith('pwd', { env: { USER: 's083027' } });
    });

    it('passed env', async () => {
      await execaCommandRunner.run('echo $MSG', { MSG: 'hi' }).run();
      expect(execa.shell).toHaveBeenCalledWith('echo $MSG', { env: { USER: 's083027', MSG: 'hi' } });
    });
  });
});

describe('EmptyCommandRunner', () => {
  it('run()', async () => {
    const rtn = await emptyCommandRunner.run().run();
    expect(rtn.isRight()).toBeTruthy();
  });
});
