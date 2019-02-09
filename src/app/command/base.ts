import { TaskEither } from 'fp-ts/lib/TaskEither';
import signale from 'signale';
import { Config } from '../config';

export abstract class Base<Deps extends {}, Args extends string[] = [], Opts extends {} = {}> {
  public constructor(
    protected readonly deps: Deps & {
      config: Config;
      logger: signale.Signale<signale.DefaultMethods>;
    },
  ) {}

  protected abstract build(opts: Opts, ...args: Args): TaskEither<string, any>;

  public async run(opts: Opts, ...args: Args) {
    try {
      await this.build(opts, ...args)
        .run()
        .then((res) => (res.isRight() ? Promise.resolve(res.value) : Promise.reject(res.value)));
    } catch (err) {
      this.deps.logger.error(err);
      return 1;
    }
    return 0;
  }
}
