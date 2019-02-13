import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Config } from '../config';
import { Logger } from '../shim/logger';

export abstract class Base<Deps extends {}, Args extends string[] = [], Opts extends {} = {}> {
  public constructor(
    protected readonly deps: Deps & {
      config: Config;
      logger: Logger;
    },
  ) {}

  protected abstract build(opts: Opts, ...args: Args): TaskEither<Error, any>;

  public async run(opts: Opts, ...args: Args) {
    try {
      await this.build(opts, ...args)
        .run()
        .then((res) => (res.isRight() ? Promise.resolve(res.value) : Promise.reject(res.value)));
    } catch (err) {
      this.deps.logger.error(err).run();
      return 1;
    }
    return 0;
  }
}
