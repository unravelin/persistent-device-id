import { CookieJar } from './cookies';
import { uuid } from './utils';

// Constant set at build time.
declare const PERSISTENT_DEVICE_ID_VERSION: string;

/**
 * Configuration for the Core module.
 */
export interface CoreConfig {
  /** The library version. Defaults to the build constant PERSISTENT_DEVICE_ID_VERSION. */
  version?: string;
  /** A string of the default prefix for the deviceId (default "pid-"). */
  prefix?: string;
  /** The name of the cookie that the deviceId is kept in (default "persistentDeviceId"). */
  cookie?: string;
  /** The name of the cookie that the sessionId is kept in (default "persistentSessionId"). */
  sessionCookie?: string;
  /** The domain on which to set cookies. */
  cookieDomain?: string;
  /** The SameSite attribute to control how cookies are sent in cross-site requests. */
  cookieSameSite?: string;
  /** The max lifetime of a deviceId, in days (default 365).
   * A value <= 0 means the cookie is treated as read-only. */
  cookieExpiryDays?: number;
  /** The sync timeout frequency in milliseconds (default 2000). */
  syncMs?: number;
  /** The send retry backoff time in milliseconds (default 150). */
  sendRetryMs?: number;
  /** Whether to initialize the sync step automatically (default true). */
  init?: boolean;
}

/**
 * The ID object containing device and session IDs.
 */
export interface IDs {
  device: string;
  session: string;
}

/**
 * The response from the Core.send method.
 */
export interface CoreResponse {
  status: number;
  text: string;
  attempt?: number;
}

/**
 * Core library instance. Provides helpers and device identification.
 */
export class Core {
  public version: string;
  public sendRetryMs: number;
  public cookie: string;
  public sessionCookie: string;
  public cookieExpiryDays: number;
  public cookies: CookieJar;
  public prefix: string;

  private _id: Promise<string | undefined>;
  private _ids?: Promise<IDs>;

  public constructor(cfg: CoreConfig) {
    this.version = cfg.version || PERSISTENT_DEVICE_ID_VERSION;
    this.sendRetryMs = cfg.sendRetryMs || 150;
    this.cookie = cfg.cookie || 'persistentDeviceId';
    this.sessionCookie = cfg.sessionCookie || 'persistentSessionId';
    this.cookieExpiryDays = cfg.cookieExpiryDays ?? 365;
    this.cookies = new CookieJar({
      domain: cfg.cookieDomain,
      sameSite: cfg.cookieSameSite,
    });

    this.prefix = typeof cfg.prefix === 'string' ? cfg.prefix : 'pid-';
    this._id = Promise.resolve(undefined);

    this.sync();

    if (cfg.init !== false) {
      this.attach(cfg.syncMs || 2000);
    }
  }

  /**
   * Reads our device ID from the browser.
   */
  public id(): Promise<string> {
    return this.ids().then(ids => {
      return ids.device;
    });
  }

  /**
   * Reads all IDs from the browser.
   */
  public ids(): Promise<IDs> {
    if (this._ids) {
      return this._ids;
    }

    this._ids = this._id.then(() => {
      let d = this.cookies.get(this.cookie);
      let s = this.cookies.get(this.sessionCookie);

      if (s) {
        // Restore d from s.
        const sep = s.indexOf(':');
        if (sep !== -1) {
          d = s.substring(0, sep);
        }

        // Strip d: from the beginning of s.
        if (d && s.startsWith(d + ':')) {
          s = s.substring(d.length + 1);
        }
      }

      return {
        device: d || this.prefix + uuid(),
        session: s || uuid(),
      };
    });

    return this._ids;
  }

  /**
   * Writes our ID into the various places we try to keep hold of it.
   */
  public sync(): Promise<void> {
    return this.ids().then(ids => {
      if (this.cookieExpiryDays > 0) {
        this.cookies.set({
          name: this.cookie,
          value: ids.device,
          expires: daysFromNow(this.cookieExpiryDays),
        });
      }
      this.cookies.set({
        name: this.sessionCookie,
        value: ids.device + ':' + ids.session,
      });
    });
  }

  /**
   * attach to the browser to maintain our ids somewhere.
   * @param syncMs How often we attempt to re-synchronise.
   */
  public attach(syncMs: number): void {
    setInterval(() => {
      this.sync();
    }, syncMs);
  }
}

/**
 * daysFromNow returns the current time, days in the future.
 */
function daysFromNow(days: number): Date {
  return new Date(new Date().getTime() + days * 86400 * 1000);
}
