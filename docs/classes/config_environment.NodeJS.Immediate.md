[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / Immediate

# Class: Immediate

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).Immediate

This object is created internally and is returned from `setImmediate()`. It
can be passed to `clearImmediate()` in order to cancel the scheduled
actions.

By default, when an immediate is scheduled, the Node.js event loop will continue
running as long as the immediate is active. The `Immediate` object returned by `setImmediate()` exports both `immediate.ref()` and `immediate.unref()`functions that can be used to
control this default behavior.

## Implements

- [`RefCounted`](../interfaces/config_environment.NodeJS.RefCounted.md)

## Table of contents

### Constructors

- [constructor](config_environment.NodeJS.Immediate.md#constructor)

### Properties

- [\_onImmediate](config_environment.NodeJS.Immediate.md#_onimmediate)

### Methods

- [[dispose]](config_environment.NodeJS.Immediate.md#[dispose])
- [hasRef](config_environment.NodeJS.Immediate.md#hasref)
- [ref](config_environment.NodeJS.Immediate.md#ref)
- [unref](config_environment.NodeJS.Immediate.md#unref)

## Constructors

### constructor

• **new Immediate**(): [`Immediate`](config_environment.NodeJS.Immediate.md)

#### Returns

[`Immediate`](config_environment.NodeJS.Immediate.md)

## Properties

### \_onImmediate

• **\_onImmediate**: `Function`

#### Defined in

node_modules/@types/node/timers.d.ts:74

## Methods

### [dispose]

▸ **[dispose]**(): `void`

Cancels the immediate. This is similar to calling `clearImmediate()`.

#### Returns

`void`

**`Since`**

v20.5.0

#### Defined in

node_modules/@types/node/timers.d.ts:79

___

### hasRef

▸ **hasRef**(): `boolean`

If true, the `Immediate` object will keep the Node.js event loop active.

#### Returns

`boolean`

**`Since`**

v11.0.0

#### Defined in

node_modules/@types/node/timers.d.ts:73

___

### ref

▸ **ref**(): [`Immediate`](config_environment.NodeJS.Immediate.md)

When called, requests that the Node.js event loop _not_ exit so long as the`Immediate` is active. Calling `immediate.ref()` multiple times will have no
effect.

By default, all `Immediate` objects are "ref'ed", making it normally unnecessary
to call `immediate.ref()` unless `immediate.unref()` had been called previously.

#### Returns

[`Immediate`](config_environment.NodeJS.Immediate.md)

a reference to `immediate`

**`Since`**

v9.7.0

#### Implementation of

[RefCounted](../interfaces/config_environment.NodeJS.RefCounted.md).[ref](../interfaces/config_environment.NodeJS.RefCounted.md#ref)

#### Defined in

node_modules/@types/node/timers.d.ts:59

___

### unref

▸ **unref**(): [`Immediate`](config_environment.NodeJS.Immediate.md)

When called, the active `Immediate` object will not require the Node.js event
loop to remain active. If there is no other activity keeping the event loop
running, the process may exit before the `Immediate` object's callback is
invoked. Calling `immediate.unref()` multiple times will have no effect.

#### Returns

[`Immediate`](config_environment.NodeJS.Immediate.md)

a reference to `immediate`

**`Since`**

v9.7.0

#### Implementation of

[RefCounted](../interfaces/config_environment.NodeJS.RefCounted.md).[unref](../interfaces/config_environment.NodeJS.RefCounted.md#unref)

#### Defined in

node_modules/@types/node/timers.d.ts:68
