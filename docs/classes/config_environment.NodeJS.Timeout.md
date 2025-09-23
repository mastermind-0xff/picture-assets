[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / Timeout

# Class: Timeout

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).Timeout

This object is created internally and is returned from `setTimeout()` and `setInterval()`. It can be passed to either `clearTimeout()` or `clearInterval()` in order to cancel the
scheduled actions.

By default, when a timer is scheduled using either `setTimeout()` or `setInterval()`, the Node.js event loop will continue running as long as the
timer is active. Each of the `Timeout` objects returned by these functions
export both `timeout.ref()` and `timeout.unref()` functions that can be used to
control this default behavior.

## Implements

- [`Timer`](../interfaces/config_environment.NodeJS.Timer.md)

## Table of contents

### Constructors

- [constructor](config_environment.NodeJS.Timeout.md#constructor)

### Methods

- [[dispose]](config_environment.NodeJS.Timeout.md#[dispose])
- [[toPrimitive]](config_environment.NodeJS.Timeout.md#[toprimitive])
- [hasRef](config_environment.NodeJS.Timeout.md#hasref)
- [ref](config_environment.NodeJS.Timeout.md#ref)
- [refresh](config_environment.NodeJS.Timeout.md#refresh)
- [unref](config_environment.NodeJS.Timeout.md#unref)

## Constructors

### constructor

• **new Timeout**(): [`Timeout`](config_environment.NodeJS.Timeout.md)

#### Returns

[`Timeout`](config_environment.NodeJS.Timeout.md)

## Methods

### [dispose]

▸ **[dispose]**(): `void`

Cancels the timeout.

#### Returns

`void`

**`Since`**

v20.5.0

#### Defined in

node_modules/@types/node/timers.d.ts:130

___

### [toPrimitive]

▸ **[toPrimitive]**(): `number`

#### Returns

`number`

#### Implementation of

[Timer](../interfaces/config_environment.NodeJS.Timer.md).[[toPrimitive]](../interfaces/config_environment.NodeJS.Timer.md#[toprimitive])

#### Defined in

node_modules/@types/node/timers.d.ts:125

___

### hasRef

▸ **hasRef**(): `boolean`

If true, the `Timeout` object will keep the Node.js event loop active.

#### Returns

`boolean`

**`Since`**

v11.0.0

#### Implementation of

[Timer](../interfaces/config_environment.NodeJS.Timer.md).[hasRef](../interfaces/config_environment.NodeJS.Timer.md#hasref)

#### Defined in

node_modules/@types/node/timers.d.ts:112

___

### ref

▸ **ref**(): [`Timeout`](config_environment.NodeJS.Timeout.md)

When called, requests that the Node.js event loop _not_ exit so long as the`Timeout` is active. Calling `timeout.ref()` multiple times will have no effect.

By default, all `Timeout` objects are "ref'ed", making it normally unnecessary
to call `timeout.ref()` unless `timeout.unref()` had been called previously.

#### Returns

[`Timeout`](config_environment.NodeJS.Timeout.md)

a reference to `timeout`

**`Since`**

v0.9.1

#### Implementation of

[Timer](../interfaces/config_environment.NodeJS.Timer.md).[ref](../interfaces/config_environment.NodeJS.Timer.md#ref)

#### Defined in

node_modules/@types/node/timers.d.ts:99

___

### refresh

▸ **refresh**(): [`Timeout`](config_environment.NodeJS.Timeout.md)

Sets the timer's start time to the current time, and reschedules the timer to
call its callback at the previously specified duration adjusted to the current
time. This is useful for refreshing a timer without allocating a new
JavaScript object.

Using this on a timer that has already called its callback will reactivate the
timer.

#### Returns

[`Timeout`](config_environment.NodeJS.Timeout.md)

a reference to `timeout`

**`Since`**

v10.2.0

#### Implementation of

[Timer](../interfaces/config_environment.NodeJS.Timer.md).[refresh](../interfaces/config_environment.NodeJS.Timer.md#refresh)

#### Defined in

node_modules/@types/node/timers.d.ts:124

___

### unref

▸ **unref**(): [`Timeout`](config_environment.NodeJS.Timeout.md)

When called, the active `Timeout` object will not require the Node.js event loop
to remain active. If there is no other activity keeping the event loop running,
the process may exit before the `Timeout` object's callback is invoked. Calling`timeout.unref()` multiple times will have no effect.

#### Returns

[`Timeout`](config_environment.NodeJS.Timeout.md)

a reference to `timeout`

**`Since`**

v0.9.1

#### Implementation of

[Timer](../interfaces/config_environment.NodeJS.Timer.md).[unref](../interfaces/config_environment.NodeJS.Timer.md#unref)

#### Defined in

node_modules/@types/node/timers.d.ts:107
