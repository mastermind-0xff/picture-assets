[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](config_environment.md) / NodeJS

# Namespace: NodeJS

[config/environment](config_environment.md).NodeJS

## Table of contents

### Classes

- [Immediate](../classes/config_environment.NodeJS.Immediate.md)
- [Timeout](../classes/config_environment.NodeJS.Timeout.md)

### Interfaces

- [CallSite](../interfaces/config_environment.NodeJS.CallSite.md)
- [CpuUsage](../interfaces/config_environment.NodeJS.CpuUsage.md)
- [Dict](../interfaces/config_environment.NodeJS.Dict.md)
- [EmitWarningOptions](../interfaces/config_environment.NodeJS.EmitWarningOptions.md)
- [ErrnoException](../interfaces/config_environment.NodeJS.ErrnoException.md)
- [EventEmitter](../interfaces/config_environment.NodeJS.EventEmitter.md)
- [HRTime](../interfaces/config_environment.NodeJS.HRTime.md)
- [MemoryUsage](../interfaces/config_environment.NodeJS.MemoryUsage.md)
- [MemoryUsageFn](../interfaces/config_environment.NodeJS.MemoryUsageFn.md)
- [Module](../interfaces/config_environment.NodeJS.Module.md)
- [Process](../interfaces/config_environment.NodeJS.Process.md)
- [ProcessConfig](../interfaces/config_environment.NodeJS.ProcessConfig.md)
- [ProcessEnv](../interfaces/config_environment.NodeJS.ProcessEnv.md)
- [ProcessRelease](../interfaces/config_environment.NodeJS.ProcessRelease.md)
- [ProcessReport](../interfaces/config_environment.NodeJS.ProcessReport.md)
- [ProcessVersions](../interfaces/config_environment.NodeJS.ProcessVersions.md)
- [ReadOnlyDict](../interfaces/config_environment.NodeJS.ReadOnlyDict.md)
- [ReadStream](../interfaces/config_environment.NodeJS.ReadStream.md)
- [ReadWriteStream](../interfaces/config_environment.NodeJS.ReadWriteStream.md)
- [ReadableStream](../interfaces/config_environment.NodeJS.ReadableStream.md)
- [RefCounted](../interfaces/config_environment.NodeJS.RefCounted.md)
- [Require](../interfaces/config_environment.NodeJS.Require.md)
- [RequireExtensions](../interfaces/config_environment.NodeJS.RequireExtensions.md)
- [RequireResolve](../interfaces/config_environment.NodeJS.RequireResolve.md)
- [ResourceUsage](../interfaces/config_environment.NodeJS.ResourceUsage.md)
- [Socket](../interfaces/config_environment.NodeJS.Socket.md)
- [Timer](../interfaces/config_environment.NodeJS.Timer.md)
- [WritableStream](../interfaces/config_environment.NodeJS.WritableStream.md)
- [WriteStream](../interfaces/config_environment.NodeJS.WriteStream.md)

### Type Aliases

- [Architecture](config_environment.NodeJS.md#architecture)
- [ArrayBufferView](config_environment.NodeJS.md#arraybufferview)
- [BeforeExitListener](config_environment.NodeJS.md#beforeexitlistener)
- [BufferEncoding](config_environment.NodeJS.md#bufferencoding)
- [DisconnectListener](config_environment.NodeJS.md#disconnectlistener)
- [ExitListener](config_environment.NodeJS.md#exitlistener)
- [MessageListener](config_environment.NodeJS.md#messagelistener)
- [MultipleResolveListener](config_environment.NodeJS.md#multipleresolvelistener)
- [MultipleResolveType](config_environment.NodeJS.md#multipleresolvetype)
- [Platform](config_environment.NodeJS.md#platform)
- [RejectionHandledListener](config_environment.NodeJS.md#rejectionhandledlistener)
- [Signals](config_environment.NodeJS.md#signals)
- [SignalsListener](config_environment.NodeJS.md#signalslistener)
- [TypedArray](config_environment.NodeJS.md#typedarray)
- [UncaughtExceptionListener](config_environment.NodeJS.md#uncaughtexceptionlistener)
- [UncaughtExceptionOrigin](config_environment.NodeJS.md#uncaughtexceptionorigin)
- [UnhandledRejectionListener](config_environment.NodeJS.md#unhandledrejectionlistener)
- [WarningListener](config_environment.NodeJS.md#warninglistener)
- [WorkerListener](config_environment.NodeJS.md#workerlistener)

## Type Aliases

### Architecture

Ƭ **Architecture**: ``"arm"`` \| ``"arm64"`` \| ``"ia32"`` \| ``"mips"`` \| ``"mipsel"`` \| ``"ppc"`` \| ``"ppc64"`` \| ``"riscv64"`` \| ``"s390"`` \| ``"s390x"`` \| ``"x64"``

#### Defined in

node_modules/@types/node/process.d.ts:63

___

### ArrayBufferView

Ƭ **ArrayBufferView**: [`TypedArray`](config_environment.NodeJS.md#typedarray) \| `DataView`

#### Defined in

node_modules/@types/node/globals.d.ts:314

___

### BeforeExitListener

Ƭ **BeforeExitListener**: (`code`: `number`) => `void`

#### Type declaration

▸ (`code`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `number` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:115

___

### BufferEncoding

Ƭ **BufferEncoding**: ``"ascii"`` \| ``"utf8"`` \| ``"utf-8"`` \| ``"utf16le"`` \| ``"utf-16le"`` \| ``"ucs2"`` \| ``"ucs-2"`` \| ``"base64"`` \| ``"base64url"`` \| ``"latin1"`` \| ``"binary"`` \| ``"hex"``

#### Defined in

node_modules/@types/node/buffer.d.ts:232

___

### DisconnectListener

Ƭ **DisconnectListener**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:116

___

### ExitListener

Ƭ **ExitListener**: (`code`: `number`) => `void`

#### Type declaration

▸ (`code`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `code` | `number` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:117

___

### MessageListener

Ƭ **MessageListener**: (`message`: `unknown`, `sendHandle`: `unknown`) => `void`

#### Type declaration

▸ (`message`, `sendHandle`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `unknown` |
| `sendHandle` | `unknown` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:126

___

### MultipleResolveListener

Ƭ **MultipleResolveListener**: (`type`: [`MultipleResolveType`](config_environment.NodeJS.md#multipleresolvetype), `promise`: `Promise`\<`unknown`\>, `value`: `unknown`) => `void`

#### Type declaration

▸ (`type`, `promise`, `value`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`MultipleResolveType`](config_environment.NodeJS.md#multipleresolvetype) |
| `promise` | `Promise`\<`unknown`\> |
| `value` | `unknown` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:128

___

### MultipleResolveType

Ƭ **MultipleResolveType**: ``"resolve"`` \| ``"reject"``

#### Defined in

node_modules/@types/node/process.d.ts:114

___

### Platform

Ƭ **Platform**: ``"aix"`` \| ``"android"`` \| ``"darwin"`` \| ``"freebsd"`` \| ``"haiku"`` \| ``"linux"`` \| ``"openbsd"`` \| ``"sunos"`` \| ``"win32"`` \| ``"cygwin"`` \| ``"netbsd"``

#### Defined in

node_modules/@types/node/process.d.ts:51

___

### RejectionHandledListener

Ƭ **RejectionHandledListener**: (`promise`: `Promise`\<`unknown`\>) => `void`

#### Type declaration

▸ (`promise`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `promise` | `Promise`\<`unknown`\> |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:118

___

### Signals

Ƭ **Signals**: ``"SIGABRT"`` \| ``"SIGALRM"`` \| ``"SIGBUS"`` \| ``"SIGCHLD"`` \| ``"SIGCONT"`` \| ``"SIGFPE"`` \| ``"SIGHUP"`` \| ``"SIGILL"`` \| ``"SIGINT"`` \| ``"SIGIO"`` \| ``"SIGIOT"`` \| ``"SIGKILL"`` \| ``"SIGPIPE"`` \| ``"SIGPOLL"`` \| ``"SIGPROF"`` \| ``"SIGPWR"`` \| ``"SIGQUIT"`` \| ``"SIGSEGV"`` \| ``"SIGSTKFLT"`` \| ``"SIGSTOP"`` \| ``"SIGSYS"`` \| ``"SIGTERM"`` \| ``"SIGTRAP"`` \| ``"SIGTSTP"`` \| ``"SIGTTIN"`` \| ``"SIGTTOU"`` \| ``"SIGUNUSED"`` \| ``"SIGURG"`` \| ``"SIGUSR1"`` \| ``"SIGUSR2"`` \| ``"SIGVTALRM"`` \| ``"SIGWINCH"`` \| ``"SIGXCPU"`` \| ``"SIGXFSZ"`` \| ``"SIGBREAK"`` \| ``"SIGLOST"`` \| ``"SIGINFO"``

#### Defined in

node_modules/@types/node/process.d.ts:75

___

### SignalsListener

Ƭ **SignalsListener**: (`signal`: [`Signals`](config_environment.NodeJS.md#signals)) => `void`

#### Type declaration

▸ (`signal`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `signal` | [`Signals`](config_environment.NodeJS.md#signals) |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:127

___

### TypedArray

Ƭ **TypedArray**: `Uint8Array` \| `Uint8ClampedArray` \| `Uint16Array` \| `Uint32Array` \| `Int8Array` \| `Int16Array` \| `Int32Array` \| `BigUint64Array` \| `BigInt64Array` \| `Float32Array` \| `Float64Array`

#### Defined in

node_modules/@types/node/globals.d.ts:302

___

### UncaughtExceptionListener

Ƭ **UncaughtExceptionListener**: (`error`: `Error`, `origin`: [`UncaughtExceptionOrigin`](config_environment.NodeJS.md#uncaughtexceptionorigin)) => `void`

#### Type declaration

▸ (`error`, `origin`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `Error` |
| `origin` | [`UncaughtExceptionOrigin`](config_environment.NodeJS.md#uncaughtexceptionorigin) |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:119

___

### UncaughtExceptionOrigin

Ƭ **UncaughtExceptionOrigin**: ``"uncaughtException"`` \| ``"unhandledRejection"``

#### Defined in

node_modules/@types/node/process.d.ts:113

___

### UnhandledRejectionListener

Ƭ **UnhandledRejectionListener**: (`reason`: `unknown`, `promise`: `Promise`\<`unknown`\>) => `void`

#### Type declaration

▸ (`reason`, `promise`): `void`

Most of the time the unhandledRejection will be an Error, but this should not be relied upon
as *anything* can be thrown/rejected, it is therefore unsafe to assume that the value is an Error.

##### Parameters

| Name | Type |
| :------ | :------ |
| `reason` | `unknown` |
| `promise` | `Promise`\<`unknown`\> |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:124

___

### WarningListener

Ƭ **WarningListener**: (`warning`: `Error`) => `void`

#### Type declaration

▸ (`warning`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `warning` | `Error` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:125

___

### WorkerListener

Ƭ **WorkerListener**: (`worker`: `Worker`) => `void`

#### Type declaration

▸ (`worker`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `worker` | `Worker` |

##### Returns

`void`

#### Defined in

node_modules/@types/node/process.d.ts:133
