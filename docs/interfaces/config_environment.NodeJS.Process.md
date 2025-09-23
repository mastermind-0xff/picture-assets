[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / Process

# Interface: Process

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).Process

## Hierarchy

- [`EventEmitter`](config_environment.NodeJS.EventEmitter.md)

  ↳ **`Process`**

## Table of contents

### Properties

- [allowedNodeEnvironmentFlags](config_environment.NodeJS.Process.md#allowednodeenvironmentflags)
- [arch](config_environment.NodeJS.Process.md#arch)
- [argv](config_environment.NodeJS.Process.md#argv)
- [argv0](config_environment.NodeJS.Process.md#argv0)
- [config](config_environment.NodeJS.Process.md#config)
- [connected](config_environment.NodeJS.Process.md#connected)
- [debugPort](config_environment.NodeJS.Process.md#debugport)
- [env](config_environment.NodeJS.Process.md#env)
- [execArgv](config_environment.NodeJS.Process.md#execargv)
- [execPath](config_environment.NodeJS.Process.md#execpath)
- [exitCode](config_environment.NodeJS.Process.md#exitcode)
- [features](config_environment.NodeJS.Process.md#features)
- [getegid](config_environment.NodeJS.Process.md#getegid)
- [geteuid](config_environment.NodeJS.Process.md#geteuid)
- [getgid](config_environment.NodeJS.Process.md#getgid)
- [getgroups](config_environment.NodeJS.Process.md#getgroups)
- [getuid](config_environment.NodeJS.Process.md#getuid)
- [hrtime](config_environment.NodeJS.Process.md#hrtime)
- [mainModule](config_environment.NodeJS.Process.md#mainmodule)
- [memoryUsage](config_environment.NodeJS.Process.md#memoryusage)
- [pid](config_environment.NodeJS.Process.md#pid)
- [platform](config_environment.NodeJS.Process.md#platform)
- [ppid](config_environment.NodeJS.Process.md#ppid)
- [release](config_environment.NodeJS.Process.md#release)
- [report](config_environment.NodeJS.Process.md#report)
- [setegid](config_environment.NodeJS.Process.md#setegid)
- [seteuid](config_environment.NodeJS.Process.md#seteuid)
- [setgid](config_environment.NodeJS.Process.md#setgid)
- [setgroups](config_environment.NodeJS.Process.md#setgroups)
- [setuid](config_environment.NodeJS.Process.md#setuid)
- [sourceMapsEnabled](config_environment.NodeJS.Process.md#sourcemapsenabled)
- [stderr](config_environment.NodeJS.Process.md#stderr)
- [stdin](config_environment.NodeJS.Process.md#stdin)
- [stdout](config_environment.NodeJS.Process.md#stdout)
- [title](config_environment.NodeJS.Process.md#title)
- [traceDeprecation](config_environment.NodeJS.Process.md#tracedeprecation)
- [version](config_environment.NodeJS.Process.md#version)
- [versions](config_environment.NodeJS.Process.md#versions)

### Methods

- [[captureRejectionSymbol]](config_environment.NodeJS.Process.md#[capturerejectionsymbol])
- [abort](config_environment.NodeJS.Process.md#abort)
- [addListener](config_environment.NodeJS.Process.md#addlistener)
- [chdir](config_environment.NodeJS.Process.md#chdir)
- [constrainedMemory](config_environment.NodeJS.Process.md#constrainedmemory)
- [cpuUsage](config_environment.NodeJS.Process.md#cpuusage)
- [cwd](config_environment.NodeJS.Process.md#cwd)
- [disconnect](config_environment.NodeJS.Process.md#disconnect)
- [emit](config_environment.NodeJS.Process.md#emit)
- [emitWarning](config_environment.NodeJS.Process.md#emitwarning)
- [eventNames](config_environment.NodeJS.Process.md#eventnames)
- [exit](config_environment.NodeJS.Process.md#exit)
- [getMaxListeners](config_environment.NodeJS.Process.md#getmaxlisteners)
- [hasUncaughtExceptionCaptureCallback](config_environment.NodeJS.Process.md#hasuncaughtexceptioncapturecallback)
- [kill](config_environment.NodeJS.Process.md#kill)
- [listenerCount](config_environment.NodeJS.Process.md#listenercount)
- [listeners](config_environment.NodeJS.Process.md#listeners)
- [nextTick](config_environment.NodeJS.Process.md#nexttick)
- [off](config_environment.NodeJS.Process.md#off)
- [on](config_environment.NodeJS.Process.md#on)
- [once](config_environment.NodeJS.Process.md#once)
- [openStdin](config_environment.NodeJS.Process.md#openstdin)
- [prependListener](config_environment.NodeJS.Process.md#prependlistener)
- [prependOnceListener](config_environment.NodeJS.Process.md#prependoncelistener)
- [rawListeners](config_environment.NodeJS.Process.md#rawlisteners)
- [removeAllListeners](config_environment.NodeJS.Process.md#removealllisteners)
- [removeListener](config_environment.NodeJS.Process.md#removelistener)
- [resourceUsage](config_environment.NodeJS.Process.md#resourceusage)
- [send](config_environment.NodeJS.Process.md#send)
- [setMaxListeners](config_environment.NodeJS.Process.md#setmaxlisteners)
- [setSourceMapsEnabled](config_environment.NodeJS.Process.md#setsourcemapsenabled)
- [setUncaughtExceptionCaptureCallback](config_environment.NodeJS.Process.md#setuncaughtexceptioncapturecallback)
- [umask](config_environment.NodeJS.Process.md#umask)
- [uptime](config_environment.NodeJS.Process.md#uptime)

## Properties

### allowedNodeEnvironmentFlags

• **allowedNodeEnvironmentFlags**: `ReadonlySet`\<`string`\>

The `process.allowedNodeEnvironmentFlags` property is a special,
read-only `Set` of flags allowable within the `NODE_OPTIONS` environment variable.

`process.allowedNodeEnvironmentFlags` extends `Set`, but overrides`Set.prototype.has` to recognize several different possible flag
representations. `process.allowedNodeEnvironmentFlags.has()` will
return `true` in the following cases:

* Flags may omit leading single (`-`) or double (`--`) dashes; e.g.,`inspect-brk` for `--inspect-brk`, or `r` for `-r`.
* Flags passed through to V8 (as listed in `--v8-options`) may replace
one or more _non-leading_ dashes for an underscore, or vice-versa;
e.g., `--perf_basic_prof`, `--perf-basic-prof`, `--perf_basic-prof`,
etc.
* Flags may contain one or more equals (`=`) characters; all
characters after and including the first equals will be ignored;
e.g., `--stack-trace-limit=100`.
* Flags _must_ be allowable within `NODE_OPTIONS`.

When iterating over `process.allowedNodeEnvironmentFlags`, flags will
appear only _once_; each will begin with one or more dashes. Flags
passed through to V8 will contain underscores instead of non-leading
dashes:

```js
import { allowedNodeEnvironmentFlags } from 'node:process';

allowedNodeEnvironmentFlags.forEach((flag) => {
  // -r
  // --inspect-brk
  // --abort_on_uncaught_exception
  // ...
});
```

The methods `add()`, `clear()`, and `delete()` of`process.allowedNodeEnvironmentFlags` do nothing, and will fail
silently.

If Node.js was compiled _without_ `NODE_OPTIONS` support (shown in [config](config_environment.NodeJS.Process.md#config)), `process.allowedNodeEnvironmentFlags` will
contain what _would have_ been allowable.

**`Since`**

v10.10.0

#### Defined in

node_modules/@types/node/process.d.ts:1394

___

### arch

• `Readonly` **arch**: [`Architecture`](../modules/config_environment.NodeJS.md#architecture)

The operating system CPU architecture for which the Node.js binary was compiled.
Possible values are: `'arm'`, `'arm64'`, `'ia32'`, `'loong64'`, `'mips'`,`'mipsel'`, `'ppc'`, `'ppc64'`, `'riscv64'`, `'s390'`, `'s390x'`, and `'x64'`.

```js
import { arch } from 'node:process';

console.log(`This processor architecture is ${arch}`);
```

**`Since`**

v0.5.0

#### Defined in

node_modules/@types/node/process.d.ts:1094

___

### argv

• **argv**: `string`[]

The `process.argv` property returns an array containing the command-line
arguments passed when the Node.js process was launched. The first element will
be [execPath](config_environment.NodeJS.Process.md#execpath). See `process.argv0` if access to the original value
of `argv[0]` is needed. The second element will be the path to the JavaScript
file being executed. The remaining elements will be any additional command-line
arguments.

For example, assuming the following script for `process-args.js`:

```js
import { argv } from 'node:process';

// print process.argv
argv.forEach((val, index) => {
  console.log(`${index}: ${val}`);
});
```

Launching the Node.js process as:

```bash
node process-args.js one two=three four
```

Would generate the output:

```text
0: /usr/local/bin/node
1: /Users/mjr/work/node/process-args.js
2: one
3: two=three
4: four
```

**`Since`**

v0.1.27

#### Defined in

node_modules/@types/node/process.d.ts:351

___

### argv0

• **argv0**: `string`

The `process.argv0` property stores a read-only copy of the original value of`argv[0]` passed when Node.js starts.

```console
$ bash -c 'exec -a customArgv0 ./node'
> process.argv[0]
'/Volumes/code/external/node/out/Release/node'
> process.argv0
'customArgv0'
```

**`Since`**

v6.4.0

#### Defined in

node_modules/@types/node/process.d.ts:364

___

### config

• `Readonly` **config**: [`ProcessConfig`](config_environment.NodeJS.ProcessConfig.md)

The `process.config` property returns a frozen `Object` containing the
JavaScript representation of the configure options used to compile the current
Node.js executable. This is the same as the `config.gypi` file that was produced
when running the `./configure` script.

An example of the possible output looks like:

```js
{
  target_defaults:
   { cflags: [],
     default_configuration: 'Release',
     defines: [],
     include_dirs: [],
     libraries: [] },
  variables:
   {
     host_arch: 'x64',
     napi_build_version: 5,
     node_install_npm: 'true',
     node_prefix: '',
     node_shared_cares: 'false',
     node_shared_http_parser: 'false',
     node_shared_libuv: 'false',
     node_shared_zlib: 'false',
     node_use_openssl: 'true',
     node_shared_openssl: 'false',
     strict_aliasing: 'true',
     target_arch: 'x64',
     v8_use_snapshot: 1
   }
}
```

**`Since`**

v0.7.7

#### Defined in

node_modules/@types/node/process.d.ts:1005

___

### connected

• **connected**: `boolean`

If the Node.js process is spawned with an IPC channel (see the `Child Process` and `Cluster` documentation), the `process.connected` property will return`true` so long as the IPC
channel is connected and will return `false` after`process.disconnect()` is called.

Once `process.connected` is `false`, it is no longer possible to send messages
over the IPC channel using `process.send()`.

**`Since`**

v0.7.2

#### Defined in

node_modules/@types/node/process.d.ts:1352

___

### debugPort

• **debugPort**: `number`

The port used by the Node.js debugger when enabled.

```js
import process from 'node:process';

process.debugPort = 5858;
```

**`Since`**

v0.7.2

#### Defined in

node_modules/@types/node/process.d.ts:455

___

### env

• **env**: [`ProcessEnv`](config_environment.NodeJS.ProcessEnv.md)

The `process.env` property returns an object containing the user environment.
See [`environ(7)`](http://man7.org/linux/man-pages/man7/environ.7.html).

An example of this object looks like:

```js
{
  TERM: 'xterm-256color',
  SHELL: '/usr/local/bin/bash',
  USER: 'maciej',
  PATH: '~/.bin/:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin',
  PWD: '/Users/maciej',
  EDITOR: 'vim',
  SHLVL: '1',
  HOME: '/Users/maciej',
  LOGNAME: 'maciej',
  _: '/usr/local/bin/node'
}
```

It is possible to modify this object, but such modifications will not be
reflected outside the Node.js process, or (unless explicitly requested)
to other `Worker` threads.
In other words, the following example would not work:

```bash
node -e 'process.env.foo = "bar"' &#x26;&#x26; echo $foo
```

While the following will:

```js
import { env } from 'node:process';

env.foo = 'bar';
console.log(env.foo);
```

Assigning a property on `process.env` will implicitly convert the value
to a string. **This behavior is deprecated.** Future versions of Node.js may
throw an error when the value is not a string, number, or boolean.

```js
import { env } from 'node:process';

env.test = null;
console.log(env.test);
// => 'null'
env.test = undefined;
console.log(env.test);
// => 'undefined'
```

Use `delete` to delete a property from `process.env`.

```js
import { env } from 'node:process';

env.TEST = 1;
delete env.TEST;
console.log(env.TEST);
// => undefined
```

On Windows operating systems, environment variables are case-insensitive.

```js
import { env } from 'node:process';

env.TEST = 1;
console.log(env.test);
// => 1
```

Unless explicitly specified when creating a `Worker` instance,
each `Worker` thread has its own copy of `process.env`, based on its
parent thread's `process.env`, or whatever was specified as the `env` option
to the `Worker` constructor. Changes to `process.env` will not be visible
across `Worker` threads, and only the main thread can make changes that
are visible to the operating system or to native add-ons. On Windows, a copy of`process.env` on a `Worker` instance operates in a case-sensitive manner
unlike the main thread.

**`Since`**

v0.1.27

#### Defined in

node_modules/@types/node/process.d.ts:579

___

### execArgv

• **execArgv**: `string`[]

The `process.execArgv` property returns the set of Node.js-specific command-line
options passed when the Node.js process was launched. These options do not
appear in the array returned by the [argv](config_environment.NodeJS.Process.md#argv) property, and do not
include the Node.js executable, the name of the script, or any options following
the script name. These options are useful in order to spawn child processes with
the same execution environment as the parent.

```bash
node --harmony script.js --version
```

Results in `process.execArgv`:

```js
['--harmony']
```

And `process.argv`:

```js
['/usr/local/bin/node', 'script.js', '--version']
```

Refer to `Worker constructor` for the detailed behavior of worker
threads with this property.

**`Since`**

v0.7.7

#### Defined in

node_modules/@types/node/process.d.ts:393

___

### execPath

• **execPath**: `string`

The `process.execPath` property returns the absolute pathname of the executable
that started the Node.js process. Symbolic links, if any, are resolved.

```js
'/usr/local/bin/node'
```

**`Since`**

v0.1.100

#### Defined in

node_modules/@types/node/process.d.ts:403

___

### exitCode

• `Optional` **exitCode**: `number`

A number which will be the process exit code, when the process either
exits gracefully, or is exited via [exit](config_environment.NodeJS.Process.md#exit) without specifying
a code.

Specifying a code to [exit](config_environment.NodeJS.Process.md#exit) will override any
previous setting of `process.exitCode`.

**`Since`**

v0.11.8

#### Defined in

node_modules/@types/node/process.d.ts:655

___

### features

• **features**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `debug` | `boolean` |
| `inspector` | `boolean` |
| `ipv6` | `boolean` |
| `tls` | `boolean` |
| `tls_alpn` | `boolean` |
| `tls_ocsp` | `boolean` |
| `tls_sni` | `boolean` |
| `uv` | `boolean` |

#### Defined in

node_modules/@types/node/process.d.ts:1282

___

### getegid

• `Optional` **getegid**: () => `number`

#### Type declaration

▸ (): `number`

The `process.getegid()` method returns the numerical effective group identity
of the Node.js process. (See [`getegid(2)`](http://man7.org/linux/man-pages/man2/getegid.2.html).)

```js
import process from 'process';

if (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).

##### Returns

`number`

**`Since`**

v2.0.0

#### Defined in

node_modules/@types/node/process.d.ts:803

___

### geteuid

• `Optional` **geteuid**: () => `number`

#### Type declaration

▸ (): `number`

The `process.geteuid()` method returns the numerical effective user identity of
the process. (See [`geteuid(2)`](http://man7.org/linux/man-pages/man2/geteuid.2.html).)

```js
import process from 'process';

if (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).

##### Returns

`number`

**`Since`**

v2.0.0

#### Defined in

node_modules/@types/node/process.d.ts:759

___

### getgid

• `Optional` **getgid**: () => `number`

#### Type declaration

▸ (): `number`

The `process.getgid()` method returns the numerical group identity of the
process. (See [`getgid(2)`](http://man7.org/linux/man-pages/man2/getgid.2.html).)

```js
import process from 'process';

if (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).

##### Returns

`number`

**`Since`**

v0.1.31

#### Defined in

node_modules/@types/node/process.d.ts:672

___

### getgroups

• `Optional` **getgroups**: () => `number`[]

#### Type declaration

▸ (): `number`[]

The `process.getgroups()` method returns an array with the supplementary group
IDs. POSIX leaves it unspecified if the effective group ID is included but
Node.js ensures it always is.

```js
import process from 'process';

if (process.getgroups) {
  console.log(process.getgroups()); // [ 16, 21, 297 ]
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).

##### Returns

`number`[]

**`Since`**

v0.9.4

#### Defined in

node_modules/@types/node/process.d.ts:848

___

### getuid

• `Optional` **getuid**: () => `number`

#### Type declaration

▸ (): `number`

The `process.getuid()` method returns the numeric user identity of the process.
(See [`getuid(2)`](http://man7.org/linux/man-pages/man2/getuid.2.html).)

```js
import process from 'process';

if (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).

##### Returns

`number`

**`Since`**

v0.1.28

#### Defined in

node_modules/@types/node/process.d.ts:716

___

### hrtime

• **hrtime**: [`HRTime`](config_environment.NodeJS.HRTime.md)

#### Defined in

node_modules/@types/node/process.d.ts:1313

___

### mainModule

• `Optional` **mainModule**: [`Module`](config_environment.NodeJS.Module.md)

The `process.mainModule` property provides an alternative way of retrieving `require.main`. The difference is that if the main module changes at
runtime, `require.main` may still refer to the original main module in
modules that were required before the change occurred. Generally, it's
safe to assume that the two refer to the same module.

As with `require.main`, `process.mainModule` will be `undefined` if there
is no entry script.

**`Since`**

v0.1.17

**`Deprecated`**

Since v14.0.0 - Use `main` instead.

#### Defined in

node_modules/@types/node/process.d.ts:1131

___

### memoryUsage

• **memoryUsage**: [`MemoryUsageFn`](config_environment.NodeJS.MemoryUsageFn.md)

#### Defined in

node_modules/@types/node/process.d.ts:1132

___

### pid

• `Readonly` **pid**: `number`

The `process.pid` property returns the PID of the process.

```js
import { pid } from 'node:process';

console.log(`This process is pid ${pid}`);
```

**`Since`**

v0.1.15

#### Defined in

node_modules/@types/node/process.d.ts:1052

___

### platform

• `Readonly` **platform**: [`Platform`](../modules/config_environment.NodeJS.md#platform)

The `process.platform` property returns a string identifying the operating
system platform for which the Node.js binary was compiled.

Currently possible values are:

* `'aix'`
* `'darwin'`
* `'freebsd'`
* `'linux'`
* `'openbsd'`
* `'sunos'`
* `'win32'`

```js
import { platform } from 'node:process';

console.log(`This platform is ${platform}`);
```

The value `'android'` may also be returned if the Node.js is built on the
Android operating system. However, Android support in Node.js [is experimental](https://github.com/nodejs/node/blob/HEAD/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

**`Since`**

v0.1.16

#### Defined in

node_modules/@types/node/process.d.ts:1119

___

### ppid

• `Readonly` **ppid**: `number`

The `process.ppid` property returns the PID of the parent of the
current process.

```js
import { ppid } from 'node:process';

console.log(`The parent process is pid ${ppid}`);
```

**`Since`**

v9.2.0, v8.10.0, v6.13.0

#### Defined in

node_modules/@types/node/process.d.ts:1064

___

### release

• `Readonly` **release**: [`ProcessRelease`](config_environment.NodeJS.ProcessRelease.md)

The `process.release` property returns an `Object` containing metadata related
to the current release, including URLs for the source tarball and headers-only
tarball.

`process.release` contains the following properties:

```js
{
  name: 'node',
  lts: 'Hydrogen',
  sourceUrl: 'https://nodejs.org/download/release/v18.12.0/node-v18.12.0.tar.gz',
  headersUrl: 'https://nodejs.org/download/release/v18.12.0/node-v18.12.0-headers.tar.gz',
  libUrl: 'https://nodejs.org/download/release/v18.12.0/win-x64/node.lib'
}
```

In custom builds from non-release versions of the source tree, only the`name` property may be present. The additional properties should not be
relied upon to exist.

**`Since`**

v3.0.0

#### Defined in

node_modules/@types/node/process.d.ts:1281

___

### report

• `Optional` **report**: [`ProcessReport`](config_environment.NodeJS.ProcessReport.md)

`process.report` is an object whose methods are used to generate diagnostic
reports for the current process. Additional documentation is available in the `report documentation`.

**`Since`**

v11.8.0

#### Defined in

node_modules/@types/node/process.d.ts:1400

___

### setegid

• `Optional` **setegid**: (`id`: `string` \| `number`) => `void`

#### Type declaration

▸ (`id`): `void`

The `process.setegid()` method sets the effective group identity of the process.
(See [`setegid(2)`](http://man7.org/linux/man-pages/man2/setegid.2.html).) The `id` can be passed as either a numeric ID or a group
name string. If a group name is specified, this method blocks while resolving
the associated a numeric ID.

```js
import process from 'process';

if (process.getegid &#x26;&#x26; process.setegid) {
  console.log(`Current gid: ${process.getegid()}`);
  try {
    process.setegid(501);
    console.log(`New gid: ${process.getegid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).
This feature is not available in `Worker` threads.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` \| `number` | A group name or ID |

##### Returns

`void`

**`Since`**

v2.0.0

#### Defined in

node_modules/@types/node/process.d.ts:830

___

### seteuid

• `Optional` **seteuid**: (`id`: `string` \| `number`) => `void`

#### Type declaration

▸ (`id`): `void`

The `process.seteuid()` method sets the effective user identity of the process.
(See [`seteuid(2)`](http://man7.org/linux/man-pages/man2/seteuid.2.html).) The `id` can be passed as either a numeric ID or a username
string. If a username is specified, the method blocks while resolving the
associated numeric ID.

```js
import process from 'process';

if (process.geteuid &#x26;&#x26; process.seteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
  try {
    process.seteuid(501);
    console.log(`New uid: ${process.geteuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).
This feature is not available in `Worker` threads.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` \| `number` | A user name or ID |

##### Returns

`void`

**`Since`**

v2.0.0

#### Defined in

node_modules/@types/node/process.d.ts:786

___

### setgid

• `Optional` **setgid**: (`id`: `string` \| `number`) => `void`

#### Type declaration

▸ (`id`): `void`

The `process.setgid()` method sets the group identity of the process. (See [`setgid(2)`](http://man7.org/linux/man-pages/man2/setgid.2.html).) The `id` can be passed as either a
numeric ID or a group name
string. If a group name is specified, this method blocks while resolving the
associated numeric ID.

```js
import process from 'process';

if (process.getgid &#x26;&#x26; process.setgid) {
  console.log(`Current gid: ${process.getgid()}`);
  try {
    process.setgid(501);
    console.log(`New gid: ${process.getgid()}`);
  } catch (err) {
    console.log(`Failed to set gid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).
This feature is not available in `Worker` threads.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` \| `number` | The group name or ID |

##### Returns

`void`

**`Since`**

v0.1.31

#### Defined in

node_modules/@types/node/process.d.ts:699

___

### setgroups

• `Optional` **setgroups**: (`groups`: readonly (`string` \| `number`)[]) => `void`

#### Type declaration

▸ (`groups`): `void`

The `process.setgroups()` method sets the supplementary group IDs for the
Node.js process. This is a privileged operation that requires the Node.js
process to have `root` or the `CAP_SETGID` capability.

The `groups` array can contain numeric group IDs, group names, or both.

```js
import process from 'process';

if (process.getgroups &#x26;&#x26; process.setgroups) {
  try {
    process.setgroups([501]);
    console.log(process.getgroups()); // new groups
  } catch (err) {
    console.log(`Failed to set groups: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).
This feature is not available in `Worker` threads.

##### Parameters

| Name | Type |
| :------ | :------ |
| `groups` | readonly (`string` \| `number`)[] |

##### Returns

`void`

**`Since`**

v0.9.4

#### Defined in

node_modules/@types/node/process.d.ts:874

___

### setuid

• `Optional` **setuid**: (`id`: `string` \| `number`) => `void`

#### Type declaration

▸ (`id`): `void`

The `process.setuid(id)` method sets the user identity of the process. (See [`setuid(2)`](http://man7.org/linux/man-pages/man2/setuid.2.html).) The `id` can be passed as either a
numeric ID or a username string.
If a username is specified, the method blocks while resolving the associated
numeric ID.

```js
import process from 'process';

if (process.getuid &#x26;&#x26; process.setuid) {
  console.log(`Current uid: ${process.getuid()}`);
  try {
    process.setuid(501);
    console.log(`New uid: ${process.getuid()}`);
  } catch (err) {
    console.log(`Failed to set uid: ${err}`);
  }
}
```

This function is only available on POSIX platforms (i.e. not Windows or
Android).
This feature is not available in `Worker` threads.

##### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `string` \| `number` |

##### Returns

`void`

**`Since`**

v0.1.28

#### Defined in

node_modules/@types/node/process.d.ts:742

___

### sourceMapsEnabled

• `Readonly` **sourceMapsEnabled**: `boolean`

The `process.sourceMapsEnabled` property returns whether the [Source Map v3](https://sourcemaps.info/spec.html) support for stack traces is enabled.

**`Since`**

v20.7.0

#### Defined in

node_modules/@types/node/process.d.ts:904

___

### stderr

• **stderr**: [`WriteStream`](config_environment.NodeJS.WriteStream.md) & \{ `fd`: ``2``  }

The `process.stderr` property returns a stream connected to`stderr` (fd `2`). It is a `net.Socket` (which is a `Duplex` stream) unless fd `2` refers to a file, in which case it is
a `Writable` stream.

`process.stderr` differs from other Node.js streams in important ways. See `note on process I/O` for more information.

#### Defined in

node_modules/@types/node/process.d.ts:295

___

### stdin

• **stdin**: [`ReadStream`](config_environment.NodeJS.ReadStream.md) & \{ `fd`: ``0``  }

The `process.stdin` property returns a stream connected to`stdin` (fd `0`). It is a `net.Socket` (which is a `Duplex` stream) unless fd `0` refers to a file, in which case it is
a `Readable` stream.

For details of how to read from `stdin` see `readable.read()`.

As a `Duplex` stream, `process.stdin` can also be used in "old" mode that
is compatible with scripts written for Node.js prior to v0.10\.
For more information see `Stream compatibility`.

In "old" streams mode the `stdin` stream is paused by default, so one
must call `process.stdin.resume()` to read from it. Note also that calling`process.stdin.resume()` itself would switch stream to "old" mode.

#### Defined in

node_modules/@types/node/process.d.ts:311

___

### stdout

• **stdout**: [`WriteStream`](config_environment.NodeJS.WriteStream.md) & \{ `fd`: ``1``  }

The `process.stdout` property returns a stream connected to`stdout` (fd `1`). It is a `net.Socket` (which is a `Duplex` stream) unless fd `1` refers to a file, in which case it is
a `Writable` stream.

For example, to copy `process.stdin` to `process.stdout`:

```js
import { stdin, stdout } from 'node:process';

stdin.pipe(stdout);
```

`process.stdout` differs from other Node.js streams in important ways. See `note on process I/O` for more information.

#### Defined in

node_modules/@types/node/process.d.ts:286

___

### title

• **title**: `string`

The `process.title` property returns the current process title (i.e. returns
the current value of `ps`). Assigning a new value to `process.title` modifies
the current value of `ps`.

When a new value is assigned, different platforms will impose different maximum
length restrictions on the title. Usually such restrictions are quite limited.
For instance, on Linux and macOS, `process.title` is limited to the size of the
binary name plus the length of the command-line arguments because setting the`process.title` overwrites the `argv` memory of the process. Node.js v0.8
allowed for longer process title strings by also overwriting the `environ`memory but that was potentially insecure and confusing in some (rather obscure)
cases.

Assigning a value to `process.title` might not result in an accurate label
within process manager applications such as macOS Activity Monitor or Windows
Services Manager.

**`Since`**

v0.1.104

#### Defined in

node_modules/@types/node/process.d.ts:1082

___

### traceDeprecation

• **traceDeprecation**: `boolean`

The `process.traceDeprecation` property indicates whether the`--trace-deprecation` flag is set on the current Node.js process. See the
documentation for the `'warning' event` and the `emitWarning() method` for more information about this
flag's behavior.

**`Since`**

v0.8.0

#### Defined in

node_modules/@types/node/process.d.ts:1438

___

### version

• `Readonly` **version**: `string`

The `process.version` property contains the Node.js version string.

```js
import { version } from 'node:process';

console.log(`Version: ${version}`);
// Version: v14.8.0
```

To get the version string without the prepended _v_, use`process.versions.node`.

**`Since`**

v0.1.3

#### Defined in

node_modules/@types/node/process.d.ts:925

___

### versions

• `Readonly` **versions**: [`ProcessVersions`](config_environment.NodeJS.ProcessVersions.md)

The `process.versions` property returns an object listing the version strings of
Node.js and its dependencies. `process.versions.modules` indicates the current
ABI version, which is increased whenever a C++ API changes. Node.js will refuse
to load modules that were compiled against a different module ABI version.

```js
import { versions } from 'node:process';

console.log(versions);
```

Will generate an object similar to:

```console
{ node: '20.2.0',
  acorn: '8.8.2',
  ada: '2.4.0',
  ares: '1.19.0',
  base64: '0.5.0',
  brotli: '1.0.9',
  cjs_module_lexer: '1.2.2',
  cldr: '43.0',
  icu: '73.1',
  llhttp: '8.1.0',
  modules: '115',
  napi: '8',
  nghttp2: '1.52.0',
  nghttp3: '0.7.0',
  ngtcp2: '0.8.1',
  openssl: '3.0.8+quic',
  simdutf: '3.2.9',
  tz: '2023c',
  undici: '5.22.0',
  unicode: '15.0',
  uv: '1.44.2',
  uvwasi: '0.0.16',
  v8: '11.3.244.8-node.9',
  zlib: '1.2.13' }
```

**`Since`**

v0.2.0

#### Defined in

node_modules/@types/node/process.d.ts:968

## Methods

### [captureRejectionSymbol]

▸ **[captureRejectionSymbol]**(`error`, `event`, `...args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `event` | `string` |
| `...args` | `any`[] |

#### Returns

`void`

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[[captureRejectionSymbol]](config_environment.NodeJS.EventEmitter.md#[capturerejectionsymbol])

#### Defined in

node_modules/@types/node/events.d.ts:540

___

### abort

▸ **abort**(): `never`

The `process.abort()` method causes the Node.js process to exit immediately and
generate a core file.

This feature is not available in `Worker` threads.

#### Returns

`never`

**`Since`**

v0.7.0

#### Defined in

node_modules/@types/node/process.d.ts:411

___

### addListener

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Alias for `emitter.on(eventName, listener)`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"beforeExit"`` |
| `listener` | [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.1.26

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[addListener](config_environment.NodeJS.EventEmitter.md#addlistener)

#### Defined in

node_modules/@types/node/process.d.ts:1440

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |
| `listener` | [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1441

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `listener` | [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1442

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `listener` | [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1443

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1444

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1445

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `listener` | [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1446

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `listener` | [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1447

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `listener` | [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1448

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `listener` | [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1449

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `listener` | [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1450

▸ **addListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.addListener

#### Defined in

node_modules/@types/node/process.d.ts:1451

___

### chdir

▸ **chdir**(`directory`): `void`

The `process.chdir()` method changes the current working directory of the
Node.js process or throws an exception if doing so fails (for instance, if
the specified `directory` does not exist).

```js
import { chdir, cwd } from 'node:process';

console.log(`Starting directory: ${cwd()}`);
try {
  chdir('/tmp');
  console.log(`New directory: ${cwd()}`);
} catch (err) {
  console.error(`chdir: ${err}`);
}
```

This feature is not available in `Worker` threads.

#### Parameters

| Name | Type |
| :------ | :------ |
| `directory` | `string` |

#### Returns

`void`

**`Since`**

v0.1.17

#### Defined in

node_modules/@types/node/process.d.ts:432

___

### constrainedMemory

▸ **constrainedMemory**(): `undefined` \| `number`

Gets the amount of memory available to the process (in bytes) based on
limits imposed by the OS. If there is no such constraint, or the constraint
is unknown, `undefined` is returned.

See [`uv_get_constrained_memory`](https://docs.libuv.org/en/v1.x/misc.html#c.uv_get_constrained_memory) for more
information.

#### Returns

`undefined` \| `number`

**`Since`**

v19.6.0, v18.15.0

#### Defined in

node_modules/@types/node/process.d.ts:1143

___

### cpuUsage

▸ **cpuUsage**(`previousValue?`): [`CpuUsage`](config_environment.NodeJS.CpuUsage.md)

The `process.cpuUsage()` method returns the user and system CPU time usage of
the current process, in an object with properties `user` and `system`, whose
values are microsecond values (millionth of a second). These values measure time
spent in user and system code respectively, and may end up being greater than
actual elapsed time if multiple CPU cores are performing work for this process.

The result of a previous call to `process.cpuUsage()` can be passed as the
argument to the function, to get a diff reading.

```js
import { cpuUsage } from 'node:process';

const startUsage = cpuUsage();
// { user: 38579, system: 6986 }

// spin the CPU for 500 milliseconds
const now = Date.now();
while (Date.now() - now < 500);

console.log(cpuUsage(startUsage));
// { user: 514883, system: 11226 }
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `previousValue?` | [`CpuUsage`](config_environment.NodeJS.CpuUsage.md) | A previous return value from calling `process.cpuUsage()` |

#### Returns

[`CpuUsage`](config_environment.NodeJS.CpuUsage.md)

**`Since`**

v6.1.0

#### Defined in

node_modules/@types/node/process.d.ts:1170

___

### cwd

▸ **cwd**(): `string`

The `process.cwd()` method returns the current working directory of the Node.js
process.

```js
import { cwd } from 'node:process';

console.log(`Current directory: ${cwd()}`);
```

#### Returns

`string`

**`Since`**

v0.1.8

#### Defined in

node_modules/@types/node/process.d.ts:444

___

### disconnect

▸ **disconnect**(): `void`

If the Node.js process is spawned with an IPC channel (see the `Child Process` and `Cluster` documentation), the `process.disconnect()` method will close the
IPC channel to the parent process, allowing the child process to exit gracefully
once there are no other connections keeping it alive.

The effect of calling `process.disconnect()` is the same as calling `ChildProcess.disconnect()` from the parent process.

If the Node.js process was not spawned with an IPC channel,`process.disconnect()` will be `undefined`.

#### Returns

`void`

**`Since`**

v0.7.2

#### Defined in

node_modules/@types/node/process.d.ts:1343

___

### emit

▸ **emit**(`event`, `code`): `boolean`

Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
import { EventEmitter } from 'node:events';
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"beforeExit"`` |
| `code` | `number` |

#### Returns

`boolean`

**`Since`**

v0.1.26

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[emit](config_environment.NodeJS.EventEmitter.md#emit)

#### Defined in

node_modules/@types/node/process.d.ts:1452

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1453

▸ **emit**(`event`, `code`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `code` | `number` |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1454

▸ **emit**(`event`, `promise`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `promise` | `Promise`\<`unknown`\> |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1455

▸ **emit**(`event`, `error`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `error` | `Error` |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1456

▸ **emit**(`event`, `error`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `error` | `Error` |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1457

▸ **emit**(`event`, `reason`, `promise`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `reason` | `unknown` |
| `promise` | `Promise`\<`unknown`\> |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1458

▸ **emit**(`event`, `warning`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `warning` | `Error` |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1459

▸ **emit**(`event`, `message`, `sendHandle`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `message` | `unknown` |
| `sendHandle` | `unknown` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1460

▸ **emit**(`event`, `signal?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `signal?` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |

#### Returns

`boolean`

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1461

▸ **emit**(`event`, `type`, `promise`, `value`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `type` | [`MultipleResolveType`](../modules/config_environment.NodeJS.md#multipleresolvetype) |
| `promise` | `Promise`\<`unknown`\> |
| `value` | `unknown` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1462

▸ **emit**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.emit

#### Defined in

node_modules/@types/node/process.d.ts:1468

___

### emitWarning

▸ **emitWarning**(`warning`, `ctor?`): `void`

The `process.emitWarning()` method can be used to emit custom or application
specific process warnings. These can be listened for by adding a handler to the `'warning'` event.

```js
import { emitWarning } from 'node:process';

// Emit a warning with a code and additional detail.
emitWarning('Something happened!', {
  code: 'MY_WARNING',
  detail: 'This is some additional information',
});
// Emits:
// (node:56338) [MY_WARNING] Warning: Something happened!
// This is some additional information
```

In this example, an `Error` object is generated internally by`process.emitWarning()` and passed through to the `'warning'` handler.

```js
import process from 'node:process';

process.on('warning', (warning) => {
  console.warn(warning.name);    // 'Warning'
  console.warn(warning.message); // 'Something happened!'
  console.warn(warning.code);    // 'MY_WARNING'
  console.warn(warning.stack);   // Stack trace
  console.warn(warning.detail);  // 'This is some additional information'
});
```

If `warning` is passed as an `Error` object, the `options` argument is ignored.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `warning` | `string` \| `Error` | The warning to emit. |
| `ctor?` | `Function` | - |

#### Returns

`void`

**`Since`**

v8.0.0

#### Defined in

node_modules/@types/node/process.d.ts:491

▸ **emitWarning**(`warning`, `type?`, `ctor?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `warning` | `string` \| `Error` |
| `type?` | `string` |
| `ctor?` | `Function` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:492

▸ **emitWarning**(`warning`, `type?`, `code?`, `ctor?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `warning` | `string` \| `Error` |
| `type?` | `string` |
| `code?` | `string` |
| `ctor?` | `Function` |

#### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:493

▸ **emitWarning**(`warning`, `options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `warning` | `string` \| `Error` |
| `options?` | [`EmitWarningOptions`](config_environment.NodeJS.EmitWarningOptions.md) |

#### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:494

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
import { EventEmitter } from 'node:events';

const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

#### Returns

(`string` \| `symbol`)[]

**`Since`**

v6.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[eventNames](config_environment.NodeJS.EventEmitter.md#eventnames)

#### Defined in

node_modules/@types/node/events.d.ts:870

___

### exit

▸ **exit**(`code?`): `never`

The `process.exit()` method instructs Node.js to terminate the process
synchronously with an exit status of `code`. If `code` is omitted, exit uses
either the 'success' code `0` or the value of `process.exitCode` if it has been
set. Node.js will not terminate until all the `'exit'` event listeners are
called.

To exit with a 'failure' code:

```js
import { exit } from 'node:process';

exit(1);
```

The shell that executed Node.js should see the exit code as `1`.

Calling `process.exit()` will force the process to exit as quickly as possible
even if there are still asynchronous operations pending that have not yet
completed fully, including I/O operations to `process.stdout` and`process.stderr`.

In most situations, it is not actually necessary to call `process.exit()`explicitly. The Node.js process will exit on its own _if there is no additional_
_work pending_ in the event loop. The `process.exitCode` property can be set to
tell the process which exit code to use when the process exits gracefully.

For instance, the following example illustrates a _misuse_ of the`process.exit()` method that could lead to data printed to stdout being
truncated and lost:

```js
import { exit } from 'node:process';

// This is an example of what *not* to do:
if (someConditionNotMet()) {
  printUsageToStdout();
  exit(1);
}
```

The reason this is problematic is because writes to `process.stdout` in Node.js
are sometimes _asynchronous_ and may occur over multiple ticks of the Node.js
event loop. Calling `process.exit()`, however, forces the process to exit _before_ those additional writes to `stdout` can be performed.

Rather than calling `process.exit()` directly, the code _should_ set the`process.exitCode` and allow the process to exit naturally by avoiding
scheduling any additional work for the event loop:

```js
import process from 'node:process';

// How to properly set the exit code while letting
// the process exit gracefully.
if (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

If it is necessary to terminate the Node.js process due to an error condition,
throwing an _uncaught_ error and allowing the process to terminate accordingly
is safer than calling `process.exit()`.

In `Worker` threads, this function stops the current thread rather
than the current process.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `code?` | `number` | The exit code. For string type, only integer strings (e.g.,'1') are allowed. |

#### Returns

`never`

**`Since`**

v0.1.13

#### Defined in

node_modules/@types/node/process.d.ts:645

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to defaultMaxListeners.

#### Returns

`number`

**`Since`**

v1.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[getMaxListeners](config_environment.NodeJS.EventEmitter.md#getmaxlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:722

___

### hasUncaughtExceptionCaptureCallback

▸ **hasUncaughtExceptionCaptureCallback**(): `boolean`

Indicates whether a callback has been set using [setUncaughtExceptionCaptureCallback](config_environment.NodeJS.Process.md#setuncaughtexceptioncapturecallback).

#### Returns

`boolean`

**`Since`**

v9.3.0

#### Defined in

node_modules/@types/node/process.d.ts:898

___

### kill

▸ **kill**(`pid`, `signal?`): ``true``

The `process.kill()` method sends the `signal` to the process identified by`pid`.

Signal names are strings such as `'SIGINT'` or `'SIGHUP'`. See `Signal Events` and [`kill(2)`](http://man7.org/linux/man-pages/man2/kill.2.html) for more information.

This method will throw an error if the target `pid` does not exist. As a special
case, a signal of `0` can be used to test for the existence of a process.
Windows platforms will throw an error if the `pid` is used to kill a process
group.

Even though the name of this function is `process.kill()`, it is really just a
signal sender, like the `kill` system call. The signal sent may do something
other than kill the target process.

```js
import process, { kill } from 'node:process';

process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
});

setTimeout(() => {
  console.log('Exiting.');
  process.exit(0);
}, 100);

kill(process.pid, 'SIGHUP');
```

When `SIGUSR1` is received by a Node.js process, Node.js will start the
debugger. See `Signal Events`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `pid` | `number` | A process ID |
| `signal?` | `string` \| `number` | The signal to send, either as a string or number. |

#### Returns

``true``

**`Since`**

v0.0.6

#### Defined in

node_modules/@types/node/process.d.ts:1041

___

### listenerCount

▸ **listenerCount**(`eventName`, `listener?`): `number`

Returns the number of listeners listening for the event named `eventName`.
If `listener` is provided, it will return how many times the listener is found
in the list of the listeners of the event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event being listened for |
| `listener?` | `Function` | The event handler function |

#### Returns

`number`

**`Since`**

v3.2.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[listenerCount](config_environment.NodeJS.EventEmitter.md#listenercount)

#### Defined in

node_modules/@types/node/events.d.ts:816

___

### listeners

▸ **listeners**(`event`): [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener)[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"beforeExit"`` |

#### Returns

[`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener)[]

**`Since`**

v0.1.26

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[listeners](config_environment.NodeJS.EventEmitter.md#listeners)

#### Defined in

node_modules/@types/node/process.d.ts:1519

▸ **listeners**(`event`): [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |

#### Returns

[`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1520

▸ **listeners**(`event`): [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |

#### Returns

[`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1521

▸ **listeners**(`event`): [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |

#### Returns

[`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1522

▸ **listeners**(`event`): [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |

#### Returns

[`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1523

▸ **listeners**(`event`): [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |

#### Returns

[`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1524

▸ **listeners**(`event`): [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |

#### Returns

[`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1525

▸ **listeners**(`event`): [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |

#### Returns

[`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1526

▸ **listeners**(`event`): [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |

#### Returns

[`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1527

▸ **listeners**(`event`): [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |

#### Returns

[`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1528

▸ **listeners**(`event`): [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |

#### Returns

[`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1529

▸ **listeners**(`event`): [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |

#### Returns

[`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener)[]

#### Overrides

EventEmitter.listeners

#### Defined in

node_modules/@types/node/process.d.ts:1530

___

### nextTick

▸ **nextTick**(`callback`, `...args`): `void`

`process.nextTick()` adds `callback` to the "next tick queue". This queue is
fully drained after the current operation on the JavaScript stack runs to
completion and before the event loop is allowed to continue. It's possible to
create an infinite loop if one were to recursively call `process.nextTick()`.
See the [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick) guide for more background.

```js
import { nextTick } from 'node:process';

console.log('start');
nextTick(() => {
  console.log('nextTick callback');
});
console.log('scheduled');
// Output:
// start
// scheduled
// nextTick callback
```

This is important when developing APIs in order to give users the opportunity
to assign event handlers _after_ an object has been constructed but before any
I/O has occurred:

```js
import { nextTick } from 'node:process';

function MyThing(options) {
  this.setupOptions(options);

  nextTick(() => {
    this.startDoingStuff();
  });
}

const thing = new MyThing();
thing.getReadyForStuff();

// thing.startDoingStuff() gets called now, not before.
```

It is very important for APIs to be either 100% synchronous or 100%
asynchronous. Consider this example:

```js
// WARNING!  DO NOT USE!  BAD UNSAFE HAZARD!
function maybeSync(arg, cb) {
  if (arg) {
    cb();
    return;
  }

  fs.stat('file', cb);
}
```

This API is hazardous because in the following case:

```js
const maybeTrue = Math.random() > 0.5;

maybeSync(maybeTrue, () => {
  foo();
});

bar();
```

It is not clear whether `foo()` or `bar()` will be called first.

The following approach is much better:

```js
import { nextTick } from 'node:process';

function definitelyAsync(arg, cb) {
  if (arg) {
    nextTick(cb);
    return;
  }

  fs.stat('file', cb);
}
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback` | `Function` | - |
| `...args` | `any`[] | Additional arguments to pass when invoking the `callback` |

#### Returns

`void`

**`Since`**

v0.1.26

#### Defined in

node_modules/@types/node/process.d.ts:1259

___

### off

▸ **off**(`eventName`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v10.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[off](config_environment.NodeJS.EventEmitter.md#off)

#### Defined in

node_modules/@types/node/events.d.ts:695

___

### on

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Adds the `listener` function to the end of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | ``"beforeExit"`` | The name of the event. |
| `listener` | [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener) | The callback function |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.1.101

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[on](config_environment.NodeJS.EventEmitter.md#on)

#### Defined in

node_modules/@types/node/process.d.ts:1469

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |
| `listener` | [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1470

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `listener` | [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1471

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `listener` | [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1472

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1473

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1474

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `listener` | [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1475

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `listener` | [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1476

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `listener` | [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1477

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `listener` | [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1478

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `listener` | [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1479

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1480

▸ **on**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.on

#### Defined in

node_modules/@types/node/process.d.ts:1481

___

### once

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Adds a **one-time**`listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
import { EventEmitter } from 'node:events';
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | ``"beforeExit"`` | The name of the event. |
| `listener` | [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener) | The callback function |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.3.0

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[once](config_environment.NodeJS.EventEmitter.md#once)

#### Defined in

node_modules/@types/node/process.d.ts:1482

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |
| `listener` | [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1483

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `listener` | [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1484

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `listener` | [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1485

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1486

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1487

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `listener` | [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1488

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `listener` | [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1489

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `listener` | [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1490

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `listener` | [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1491

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `listener` | [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1492

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1493

▸ **once**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.once

#### Defined in

node_modules/@types/node/process.d.ts:1494

___

### openStdin

▸ **openStdin**(): [`Socket`](config_environment.NodeJS.Socket.md)

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Defined in

node_modules/@types/node/process.d.ts:314

___

### prependListener

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | ``"beforeExit"`` | The name of the event. |
| `listener` | [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener) | The callback function |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v6.0.0

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[prependListener](config_environment.NodeJS.EventEmitter.md#prependlistener)

#### Defined in

node_modules/@types/node/process.d.ts:1495

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |
| `listener` | [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1496

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `listener` | [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1497

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `listener` | [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1498

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1499

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1500

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `listener` | [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1501

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `listener` | [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1502

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `listener` | [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1503

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `listener` | [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1504

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `listener` | [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1505

▸ **prependListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependListener

#### Defined in

node_modules/@types/node/process.d.ts:1506

___

### prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | ``"beforeExit"`` | The name of the event. |
| `listener` | [`BeforeExitListener`](../modules/config_environment.NodeJS.md#beforeexitlistener) | The callback function |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v6.0.0

#### Overrides

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[prependOnceListener](config_environment.NodeJS.EventEmitter.md#prependoncelistener)

#### Defined in

node_modules/@types/node/process.d.ts:1507

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"disconnect"`` |
| `listener` | [`DisconnectListener`](../modules/config_environment.NodeJS.md#disconnectlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1508

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"exit"`` |
| `listener` | [`ExitListener`](../modules/config_environment.NodeJS.md#exitlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1509

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"rejectionHandled"`` |
| `listener` | [`RejectionHandledListener`](../modules/config_environment.NodeJS.md#rejectionhandledlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1510

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtException"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1511

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"uncaughtExceptionMonitor"`` |
| `listener` | [`UncaughtExceptionListener`](../modules/config_environment.NodeJS.md#uncaughtexceptionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1512

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unhandledRejection"`` |
| `listener` | [`UnhandledRejectionListener`](../modules/config_environment.NodeJS.md#unhandledrejectionlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1513

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"warning"`` |
| `listener` | [`WarningListener`](../modules/config_environment.NodeJS.md#warninglistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1514

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"message"`` |
| `listener` | [`MessageListener`](../modules/config_environment.NodeJS.md#messagelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1515

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`Signals`](../modules/config_environment.NodeJS.md#signals) |
| `listener` | [`SignalsListener`](../modules/config_environment.NodeJS.md#signalslistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1516

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"multipleResolves"`` |
| `listener` | [`MultipleResolveListener`](../modules/config_environment.NodeJS.md#multipleresolvelistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1517

▸ **prependOnceListener**(`event`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"worker"`` |
| `listener` | [`WorkerListener`](../modules/config_environment.NodeJS.md#workerlistener) |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

#### Overrides

EventEmitter.prependOnceListener

#### Defined in

node_modules/@types/node/process.d.ts:1518

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v9.4.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[rawListeners](config_environment.NodeJS.EventEmitter.md#rawlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:766

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`Process`](config_environment.NodeJS.Process.md)

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[removeAllListeners](config_environment.NodeJS.EventEmitter.md#removealllisteners)

#### Defined in

node_modules/@types/node/events.d.ts:706

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`Process`](config_environment.NodeJS.Process.md)

Removes the specified `listener` from the listener array for the event named`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any`removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
import { EventEmitter } from 'node:events';
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`listener is removed:

```js
import { EventEmitter } from 'node:events';
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[removeListener](config_environment.NodeJS.EventEmitter.md#removelistener)

#### Defined in

node_modules/@types/node/events.d.ts:690

___

### resourceUsage

▸ **resourceUsage**(): [`ResourceUsage`](config_environment.NodeJS.ResourceUsage.md)

```js
import { resourceUsage } from 'node:process';

console.log(resourceUsage());
/*
  Will output:
  {
    userCPUTime: 82872,
    systemCPUTime: 4143,
    maxRSS: 33164,
    sharedMemorySize: 0,
    unsharedDataSize: 0,
    unsharedStackSize: 0,
    minorPageFault: 2469,
    majorPageFault: 0,
    swappedOut: 0,
    fsRead: 0,
    fsWrite: 8,
    ipcSent: 0,
    ipcReceived: 0,
    signalsCount: 0,
    voluntaryContextSwitches: 79,
    involuntaryContextSwitches: 1
  }

```

#### Returns

[`ResourceUsage`](config_environment.NodeJS.ResourceUsage.md)

the resource usage for the current process. All of these values come from the `uv_getrusage` call which returns a [`uv_rusage_t` struct][uv_rusage_t].

**`Since`**

v12.6.0

#### Defined in

node_modules/@types/node/process.d.ts:1431

___

### send

▸ **send**(`message`, `sendHandle?`, `options?`, `callback?`): `boolean`

If Node.js is spawned with an IPC channel, the `process.send()` method can be
used to send messages to the parent process. Messages will be received as a `'message'` event on the parent's `ChildProcess` object.

If Node.js was not spawned with an IPC channel, `process.send` will be `undefined`.

The message goes through serialization and parsing. The resulting message might
not be the same as what is originally sent.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `any` | - |
| `sendHandle?` | `any` | - |
| `options?` | `Object` | used to parameterize the sending of certain types of handles.`options` supports the following properties: |
| `options.swallowErrors?` | `boolean` | - |
| `callback?` | (`error`: ``null`` \| `Error`) => `void` | - |

#### Returns

`boolean`

**`Since`**

v0.5.9

#### Defined in

node_modules/@types/node/process.d.ts:1325

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`Process`](config_environment.NodeJS.Process.md)

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

[`Process`](config_environment.NodeJS.Process.md)

**`Since`**

v0.3.5

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[setMaxListeners](config_environment.NodeJS.EventEmitter.md#setmaxlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:716

___

### setSourceMapsEnabled

▸ **setSourceMapsEnabled**(`value`): `void`

This function enables or disables the Source Map v3 support for stack traces.
It provides same features as launching Node.js process with commandline options --enable-source-maps.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `boolean` |

#### Returns

`void`

**`Since`**

v16.6.0

#### Defined in

node_modules/@types/node/process.d.ts:911

___

### setUncaughtExceptionCaptureCallback

▸ **setUncaughtExceptionCaptureCallback**(`cb`): `void`

The `process.setUncaughtExceptionCaptureCallback()` function sets a function
that will be invoked when an uncaught exception occurs, which will receive the
exception value itself as its first argument.

If such a function is set, the `'uncaughtException'` event will
not be emitted. If `--abort-on-uncaught-exception` was passed from the
command line or set through `v8.setFlagsFromString()`, the process will
not abort. Actions configured to take place on exceptions such as report
generations will be affected too

To unset the capture function,`process.setUncaughtExceptionCaptureCallback(null)` may be used. Calling this
method with a non-`null` argument while another capture function is set will
throw an error.

Using this function is mutually exclusive with using the deprecated `domain` built-in module.

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | ``null`` \| (`err`: `Error`) => `void` |

#### Returns

`void`

**`Since`**

v9.3.0

#### Defined in

node_modules/@types/node/process.d.ts:893

___

### umask

▸ **umask**(): `number`

`process.umask()` returns the Node.js process's file mode creation mask. Child
processes inherit the mask from the parent process.

#### Returns

`number`

**`Since`**

v0.1.19

**`Deprecated`**

Calling `process.umask()` with no argument causes the process-wide umask to be written twice. This introduces a race condition between threads, and is a potential   *
security vulnerability. There is no safe, cross-platform alternative API.

#### Defined in

node_modules/@types/node/process.d.ts:1299

▸ **umask**(`mask`): `number`

Can only be set if not in worker thread.

#### Parameters

| Name | Type |
| :------ | :------ |
| `mask` | `string` \| `number` |

#### Returns

`number`

#### Defined in

node_modules/@types/node/process.d.ts:1303

___

### uptime

▸ **uptime**(): `number`

The `process.uptime()` method returns the number of seconds the current Node.js
process has been running.

The return value includes fractions of a second. Use `Math.floor()` to get whole
seconds.

#### Returns

`number`

**`Since`**

v0.5.0

#### Defined in

node_modules/@types/node/process.d.ts:1312
