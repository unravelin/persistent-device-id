describe('persistent-device-id.core', function () {
  beforeEach(function () {
    // Delete all cookies. The tests should be fully isolated anyway, but this
    // makes the error output cleaner.
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });

  describe('#sync', function () {
    // Test cases generated using:
    //
    //    var tc = [];
    //    [undefined, "dev-cook"].forEach(
    //      d => [undefined, "sess-cook", "sess-dev-cook:sess-cook"].forEach(
    //        s => [undefined, "opt-id"].forEach(
    //          id => tc.push({
    //            cookies: {device: d, session: s},
    //            cfg: {id},
    //            exp: {device: "", session: ""}
    //          })
    //        )
    //      )
    //    )
    //    console.log(JSON.stringify(tc, null, 2));

    /**
     * @typedef {object} IDsTest
     * @prop {object} cfg The pre-isolation config for the PersistentDeviceId instance.
     * @prop {object} cookies Cookies to set before running the tes
     * @prop {string} cookies.device The value to set the device ID to in cookies.
     * @prop {string} cookies.session The value to set the session ID to in cookies.
     * @prop {Regexp} exp.device The expected device ID pattern.
     * @prop {Regexp} exp.session The expected session ID pattern.
     */
    /**
     * @type {IDsTest[]}
     */
    const tc = [
      {
        cookies: {},
        cfg: {},
        exp: {
          device: /pid-[a-z0-9-]{30,}/,
          session: /[a-z0-9-]{30,}/,
        },
      },
      {
        cookies: { session: 'sess-cook' },
        cfg: {},
        exp: {
          device: /pid-[a-z0-9-]{30,}/,
          session: /sess-cook/,
        },
      },
      {
        cookies: { session: 'sess-dev-cook:sess-cook' },
        cfg: {},
        exp: {
          device: /sess-dev-cook/,
          session: /sess-cook/,
        },
      },
      {
        cookies: { device: 'dev-cook' },
        cfg: {},
        exp: {
          device: /dev-cook/,
          session: /[a-z0-9-]{30,}/,
        },
      },
      {
        cookies: {
          device: 'dev-cook',
          session: 'sess-cook',
        },
        cfg: {},
        exp: {
          device: /dev-cook/,
          session: /sess-cook/,
        },
      },
      {
        cookies: {
          device: 'dev-cook',
          session: 'sess-dev-cook:sess-cook',
        },
        cfg: {},
        exp: {
          device: /sess-dev-cook/,
          session: /sess-cook/,
        },
      },
    ];
    tc.forEach(function (t) {
      it('passes ' + JSON.stringify(t), function () {
        const cfg = isolate(t.cfg || {});
        if (t.cookies) {
          if (t.cookies.device) document.cookie = cfg.cookie + '=' + t.cookies.device;
          if (t.cookies.session) document.cookie = cfg.sessionCookie + '=' + t.cookies.session;
        }
        const r = new PersistentDeviceId(cfg);
        return r.core.ids().then(function (ids) {
          expect(ids.device).to.match(t.exp.device);
          expect(ids.session).to.match(t.exp.session);
          expect(r.core.cookies.get(cfg.sessionCookie)).to.equal(ids.device + ':' + ids.session);
          expect(r.core.cookies.get(cfg.cookie)).to.equal(ids.device);
        });
      });
    });
  });

  describe('#id', function () {
    it('returns IDs that expire after cookieExpiryDays', function () {
      this.timeout(4000);
      function msToDays(ms) {
        return ms / (86400 * 1000);
      }

      // This test must happen before other PersistentDeviceId instances start persisting a
      // cookie.
      const r = new PersistentDeviceId(
        isolate({
          cookie: 'expiredDeviceId',
          syncMs: 10000,

          // Expiry times are formatted with second granularity, so it's hard to
          // make this quicker. Is it safe to change?
          cookieExpiryDays: msToDays(1500),
        })
      );
      return r.core.id().then(function (id) {
        expect(id).to.match(/pid-[a-z0-9-]{30,}/);
        expect(r.core.cookies.get('expiredDeviceId')).to.equal(id);

        return new Promise(function (resolve) {
          setTimeout(resolve, 2000);
        }).then(function () {
          expect(r.core.cookies.get('expiredDeviceId')).to.equal(undefined);
        });
      });
    });

    it('returns IDs', function () {
      const r = new PersistentDeviceId(isolate({}));
      return r.core.id().then(function (id) {
        expect(id).to.match(/pid-[a-z0-9-]{30,}/);
      });
    });

    it('returns IDs with a custom prefix', function () {
      const r = new PersistentDeviceId(
        isolate({
          prefix: '',
        })
      );
      return r.core.id().then(function (id) {
        expect(id).to.match(/^\w{8}[-]\w{4}[-]\w{4}[-]\w{4}[-]\w{12}$/);
      });
    });

    it('keeps returning the same ID', function () {
      const r = new PersistentDeviceId(isolate({}));
      return r.core.id().then(function (id1) {
        return r.core.id().then(function (id2) {
          expect(id1).to.deep.equal(id2);
        });
      });
    });

    it('returns the same device ID in id() and ids()', function () {
      const r = new PersistentDeviceId(isolate({}));
      return r.core.id().then(function (device) {
        return r.core.ids().then(function (ids) {
          expect(device).to.deep.equal(ids.device);
        });
      });
    });

    it('sets the persistentDeviceId and persistentSessionId cookies by default', function () {
      const r = new PersistentDeviceId({});
      return r.core.ids().then(function (ids) {
        expect(document.cookie).to.match(new RegExp('\\bpersistentDeviceId=' + ids.device + '\\b'));
        expect(r.core.cookies.get('persistentDeviceId')).to.equal(ids.device);

        expect(document.cookie).to.match(
          new RegExp('\\bpersistentSessionId=' + ids.device + ':' + ids.session + '\\b')
        );
        expect(r.core.cookies.get('persistentSessionId')).to.equal(ids.device + ':' + ids.session);
      });
    });

    it(`doesn't set a device ID cookie if cookieExpiryDays < 0`, function () {
      const cfg = isolate({
        cookieExpiryDays: -1,
      });
      const r = new PersistentDeviceId(cfg);
      return r.core.id().then(function () {
        expect(r.core.cookies.get(cfg.cookie)).to.equal(undefined);
      });
    });

    it(`doesn't set a device ID cookie if cookieExpiryDays = 0`, function () {
      const cfg = isolate({
        cookieExpiryDays: 0,
      });
      const r = new PersistentDeviceId(cfg);
      return r.core.id().then(function () {
        expect(r.core.cookies.get(cfg.cookie)).to.equal(undefined);
      });
    });

    it('sets a customisable cookie', function () {
      const r = new PersistentDeviceId(
        isolate({
          cookie: 'custom-guid',
        })
      );
      return r.core.id().then(function (id) {
        expect(document.cookie).to.match(new RegExp('\\bcustom-guid=' + id + '\\b'));
      });
    });

    it('reinstates an ID removed from cookies', function () {
      const cfg = isolate({
        cookie: 'removed-cookie',
        syncMs: 10,
      });
      const r1 = new PersistentDeviceId(cfg);
      return r1.core.id().then(function (id1) {
        // Remove the cookie.
        r1.core.cookies.set({
          name: 'removed-cookie',
          value: 'unset',
          expires: new Date(new Date().getTime() - 10000),
        });
        expect(r1.core.cookies.get('removed-cookie')).to.equal(undefined);
        expect(document.cookie).to.not.match(/\bremoved-cookie=\b/);

        // Wait for the sync to reoccur..
        return new Promise(function (resolve) {
          setTimeout(resolve, 300);
        }).then(function () {
          const r2 = new PersistentDeviceId(cfg);
          return r2.core.id().then(function (id2) {
            expect(id1).to.deep.equal(id2);
          });
        });
      });
    });
  });

  describe('#Core', function () {
    it('respects explicit SameSite attribute', function () {
      // JavaScript cannot directly read the SameSite attribute of a stored
      // cookie, so this config option can't be tested easily. At least we can
      // check that the config is passed through to the cookie jar.
      const cfg = isolate({ cookieSameSite: 'Strict;Secure' });
      const r = new PersistentDeviceId(cfg);
      expect(r.core.cookies.cfg.sameSite).to.equal('Strict;Secure');
    });
  });
});

/**
 * isolate returns the cfg instance with a few isolating test defaults added.
 * The ns option is for isolate only, and is not passed through to PersistentDeviceId.
 * All other properties documented here are the defaults.
 *
 * @param {object} cfg
 * @param {string} [cfg.ns=testn] A namespace added to the cookie names. Not
 * used by this function.
 * @param {string} [cfg.cookie=persistentDeviceId-ns]
 * @param {int} [cfg.syncMs=30000]
 * @returns {object} The mutated cfg.
 */
function isolate(cfg) {
  if (!isolate.n) isolate.n = 0;
  var ns = cfg.ns || 'test' + isolate.n++;
  delete cfg.ns;

  if (!('cookie' in cfg)) {
    cfg.cookie = 'persistentDeviceId-' + ns;
  }
  if (!('sessionCookie' in cfg)) {
    cfg.sessionCookie = 'persistentSessionId-' + ns;
  }
  if (!('syncMs' in cfg)) {
    cfg.syncMs = 30000;
  }
  return cfg;
}
