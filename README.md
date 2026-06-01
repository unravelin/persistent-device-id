# Persistent Device Id

persistent-device-id is a JavaScript library that creates an identifier that
is attached to a user's browser session.

Please feel welcome to create issues or submit pull requests on [the
project](https://github.com/unravelin/persistent-device-id).

## Table of Contents

- [Quickstart](#quickstart)
- [Bundles](#bundles)
  - [npm](#npm)
- [Content-Security-Policy](#content-security-policy)
- [Script Integrity](#script-integrity)
- [Browser Compatibility](#browser-compatibility)
- [Examples](#examples)
  - [deviceId Prefix](#deviceid-prefix)
  - [API base URL](#api-base-url)
- [Reference](#reference)
  - `[var persistentDeviceId = new PersistentDeviceId()](#var-persistent-device-id--new-persistentdeviceidcfg-object)`
  - `[persistentDeviceId.id(): Promise<string>](#persistentdeviceid-promisestring)`

## Quickstart

Get a copy of
[persistent-device-id.min.js on Github releases][releases] and
instantiate your PersistentDeviceId instance on the page:

```html
<script src="persistent-device-id.min.js"></script>
<script>
  var persistentDeviceId = new PersistentDeviceId();
</script>
```

> If you have a build system, you can instead install [persistent-device-id with
> npm](https://npmjs.com/persistent-device-id) using `npm i persistent-device-id@1`
> and require or import PersistentDeviceId for instantiating:
>
> ```js
> import PersistentDeviceId from 'persistent-device-id';
>
> /* or */ const PersistentDeviceId = require('persistent-device-id');
> var persistentDeviceId = new PersistentDeviceId();
> ```

This will set the `persistentDeviceId` cookie on your domain and then allow you to call:

- `persistentDeviceId.id().then(function(id) { ... })` to get the deviceId.

Read on for more details.

---

### npm

If you have a JavaScript build system and would prefer to include PersistentDeviceId
using it, you can install [persistent-device-id from
npm](https://www.npmjs.com/package/persistent-device-id) with:

```bash
npm install persistent-device-id@1
```

You can then import the desired bundle within the PersistentDeviceId library. For
example, to load the core+track bundle using `require` is:

```js
var PersistentDeviceId = require('persistentDeviceId');
```

Or to load with ES6 imports is:

```js
import PersistentDeviceId from 'persistent-device-id';
```

The bundles published to npm are in [Universal Module Definition format](https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/).

## Script Integrity

If you are including the bundle directly on your page, rather than in your
build system, we recommended setting the `integrity` attribute on the script tag
to the corresponding value from the integrity file of the release. For example,
if the integrity file reads:

```
sha384-8de9e022e2f67e2072bb114e670d2fb37cab8eaf81616bcc3951087aa473e62a8b9fcc4c780a8d8d09df55c8b63bfd7c  persistent-device-id-1.0.0-rc1.js
```

then your HTML becomes:

```html
<script src="persistent-device-id-1.0.0-rc1.js" integrity="sha384-8de9e022e2f67e2072bb114e670d2fb37cab8eaf81616bcc3951087aa473e62a8b9fcc4c780a8d8d09df55c8b63bfd7c">
```

If the integrity file is next to the script in question, you can validate the
contents using:

```
sed s/^sha384-// integrity | shasum -c
```

## Browser Compatibility

Compatible on recent versions of Chrome, Safari, Firefox, and mobile.

## Examples

### deviceId Prefix

PersistentDeviceId prefixes the deviceId with `pdid-` by default. If you wish to use
something else, for example if you are [upgrading](#upgrading) from a previous
version and wish to maintain the opaque string format, simply specify your desired
prefix or omit entirely:

```js
var persistentDeviceId = new PersistentDeviceId({ prefix: '' });
```

or

```js
var persistentDeviceId = new PersistentDeviceId({ prefix: 'myid-' });
```

## Reference

### `var persistentDeviceId = new PersistentDeviceId({cfg: object})`

During your page load you need to instantiate your `PersistentDeviceId` instance:

```javascript
var rav = new PersistentDeviceId({
  /**
   * @prop {string} [prefix=pdid-] The prefix of the generated deviceId.
   */
  // prefix: 'pdid-',
  /**
   * @prop {string} [cookie=persistentDeviceId] The cookie that the deviceId is
   * persisted in.
   */
  // cookie: 'my-guid',
  /**
   * @prop {number} [cookieExpiryDays] The number of days that a device ID will live.
   * Defaults to 365 in accordance with the GDPR's ePrivacy Directive.
   */
  // cookieExpiryDays: 365,
  /**
   * @prop {string} [cookieDomain] The top-most domain that we can store
   * cookies on. If you expect your customer to navigate between multiple
   * subdomains, e.g. catalog.store.com, checkout.store.com, then set
   * cookieDomain to store.com.
   */
  // cookieDomain: 'store.com',
  /**
   * @prop {string} [cookieSameSite] The SameSite attribute to control how
   * cookies are sent in cross-site requests. If not provided, "None;Secure"
   * will be used by default for HTTPS connections. This is to support clients
   * who process card payments in iframes or WebViews.
   */
  // cookieSameSite: 'None;Secure',
});
```

### `persistentDeviceId.id(): Promise<string>`

`persistentDeviceId.id` returns [a Promise][Promise] which resolves to the device ID
string. This will eventually match the `persistentDeviceId` cookie.

```html
<form action="main">
  <input type="hidden" name="device-id" id="pdid-device-id" />
</form>
<script src="persistent-device-id.min.js">
  <script>
      var persistentDeviceId = new PersistentDeviceId();
      persistentDeviceId.id().then(function(deviceId) {
          document.getElementById('pdid-device-id').value = deviceId;
      });
</script>
```

If you are using a modern bundler and transpiler you can declare:

```js
const deviceId = await persistentDeviceId.id();
```
