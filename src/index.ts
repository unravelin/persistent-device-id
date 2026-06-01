import { Core, IDs, type CoreConfig } from './core';

export default class PersistentDeviceId {
  public core: Core;

  public constructor(cfg: CoreConfig = {}) {
    this.core = new Core(cfg);
  }

  public id(): Promise<string> {
    return this.core.id();
  }

  public ids(): Promise<IDs> {
    return this.core.ids();
  }
}
