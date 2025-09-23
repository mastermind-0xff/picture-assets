[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / WritableStream

# Interface: WritableStream

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).WritableStream

## Hierarchy

- [`EventEmitter`](config_environment.NodeJS.EventEmitter.md)

  ↳ **`WritableStream`**

  ↳↳ [`ReadWriteStream`](config_environment.NodeJS.ReadWriteStream.md)

## Table of contents

### Properties

- [writable](config_environment.NodeJS.WritableStream.md#writable)

### Methods

- [[captureRejectionSymbol]](config_environment.NodeJS.WritableStream.md#[capturerejectionsymbol])
- [addListener](config_environment.NodeJS.WritableStream.md#addlistener)
- [emit](config_environment.NodeJS.WritableStream.md#emit)
- [end](config_environment.NodeJS.WritableStream.md#end)
- [eventNames](config_environment.NodeJS.WritableStream.md#eventnames)
- [getMaxListeners](config_environment.NodeJS.WritableStream.md#getmaxlisteners)
- [listenerCount](config_environment.NodeJS.WritableStream.md#listenercount)
- [listeners](config_environment.NodeJS.WritableStream.md#listeners)
- [off](config_environment.NodeJS.WritableStream.md#off)
- [on](config_environment.NodeJS.WritableStream.md#on)
- [once](config_environment.NodeJS.WritableStream.md#once)
- [prependListener](config_environment.NodeJS.WritableStream.md#prependlistener)
- [prependOnceListener](config_environment.NodeJS.WritableStream.md#prependoncelistener)
- [rawListeners](config_environment.NodeJS.WritableStream.md#rawlisteners)
- [removeAllListeners](config_environment.NodeJS.WritableStream.md#removealllisteners)
- [removeListener](config_environment.NodeJS.WritableStream.md#removelistener)
- [setMaxListeners](config_environment.NodeJS.WritableStream.md#setmaxlisteners)
- [write](config_environment.NodeJS.WritableStream.md#write)

## Properties

### writable

• **writable**: `boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:287

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

### addListener

▸ **addListener**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

Alias for `emitter.on(eventName, listener)`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[addListener](config_environment.NodeJS.EventEmitter.md#addlistener)

#### Defined in

node_modules/@types/node/events.d.ts:545

___

### emit

▸ **emit**(`eventName`, `...args`): `boolean`

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
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[emit](config_environment.NodeJS.EventEmitter.md#emit)

#### Defined in

node_modules/@types/node/events.d.ts:807

___

### end

▸ **end**(`cb?`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb?` | () => `void` |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Defined in

node_modules/@types/node/globals.d.ts:290

▸ **end**(`data`, `cb?`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `string` \| `Uint8Array` |
| `cb?` | () => `void` |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Defined in

node_modules/@types/node/globals.d.ts:291

▸ **end**(`str`, `encoding?`, `cb?`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `cb?` | () => `void` |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

#### Defined in

node_modules/@types/node/globals.d.ts:292

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

▸ **listeners**(`eventName`): `Function`[]

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
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[listeners](config_environment.NodeJS.EventEmitter.md#listeners)

#### Defined in

node_modules/@types/node/events.d.ts:735

___

### off

▸ **off**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v10.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[off](config_environment.NodeJS.EventEmitter.md#off)

#### Defined in

node_modules/@types/node/events.d.ts:695

___

### on

▸ **on**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.1.101

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[on](config_environment.NodeJS.EventEmitter.md#on)

#### Defined in

node_modules/@types/node/events.d.ts:577

___

### once

▸ **once**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.3.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[once](config_environment.NodeJS.EventEmitter.md#once)

#### Defined in

node_modules/@types/node/events.d.ts:607

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v6.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[prependListener](config_environment.NodeJS.EventEmitter.md#prependlistener)

#### Defined in

node_modules/@types/node/events.d.ts:834

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v6.0.0

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[prependOnceListener](config_environment.NodeJS.EventEmitter.md#prependoncelistener)

#### Defined in

node_modules/@types/node/events.d.ts:850

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

▸ **removeAllListeners**(`event?`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[removeAllListeners](config_environment.NodeJS.EventEmitter.md#removealllisteners)

#### Defined in

node_modules/@types/node/events.d.ts:706

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.1.26

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[removeListener](config_environment.NodeJS.EventEmitter.md#removelistener)

#### Defined in

node_modules/@types/node/events.d.ts:690

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`WritableStream`](config_environment.NodeJS.WritableStream.md)

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

[`WritableStream`](config_environment.NodeJS.WritableStream.md)

**`Since`**

v0.3.5

#### Inherited from

[EventEmitter](config_environment.NodeJS.EventEmitter.md).[setMaxListeners](config_environment.NodeJS.EventEmitter.md#setmaxlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:716

___

### write

▸ **write**(`buffer`, `cb?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `buffer` | `string` \| `Uint8Array` |
| `cb?` | (`err?`: ``null`` \| `Error`) => `void` |

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:288

▸ **write**(`str`, `encoding?`, `cb?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `cb?` | (`err?`: ``null`` \| `Error`) => `void` |

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:289
