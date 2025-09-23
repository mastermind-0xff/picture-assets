[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / Socket

# Interface: Socket

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).Socket

## Hierarchy

- [`ReadWriteStream`](config_environment.NodeJS.ReadWriteStream.md)

  ↳ **`Socket`**

## Table of contents

### Properties

- [isTTY](config_environment.NodeJS.Socket.md#istty)
- [readable](config_environment.NodeJS.Socket.md#readable)
- [writable](config_environment.NodeJS.Socket.md#writable)

### Methods

- [[asyncIterator]](config_environment.NodeJS.Socket.md#[asynciterator])
- [[captureRejectionSymbol]](config_environment.NodeJS.Socket.md#[capturerejectionsymbol])
- [addListener](config_environment.NodeJS.Socket.md#addlistener)
- [emit](config_environment.NodeJS.Socket.md#emit)
- [end](config_environment.NodeJS.Socket.md#end)
- [eventNames](config_environment.NodeJS.Socket.md#eventnames)
- [getMaxListeners](config_environment.NodeJS.Socket.md#getmaxlisteners)
- [isPaused](config_environment.NodeJS.Socket.md#ispaused)
- [listenerCount](config_environment.NodeJS.Socket.md#listenercount)
- [listeners](config_environment.NodeJS.Socket.md#listeners)
- [off](config_environment.NodeJS.Socket.md#off)
- [on](config_environment.NodeJS.Socket.md#on)
- [once](config_environment.NodeJS.Socket.md#once)
- [pause](config_environment.NodeJS.Socket.md#pause)
- [pipe](config_environment.NodeJS.Socket.md#pipe)
- [prependListener](config_environment.NodeJS.Socket.md#prependlistener)
- [prependOnceListener](config_environment.NodeJS.Socket.md#prependoncelistener)
- [rawListeners](config_environment.NodeJS.Socket.md#rawlisteners)
- [read](config_environment.NodeJS.Socket.md#read)
- [removeAllListeners](config_environment.NodeJS.Socket.md#removealllisteners)
- [removeListener](config_environment.NodeJS.Socket.md#removelistener)
- [resume](config_environment.NodeJS.Socket.md#resume)
- [setEncoding](config_environment.NodeJS.Socket.md#setencoding)
- [setMaxListeners](config_environment.NodeJS.Socket.md#setmaxlisteners)
- [unpipe](config_environment.NodeJS.Socket.md#unpipe)
- [unshift](config_environment.NodeJS.Socket.md#unshift)
- [wrap](config_environment.NodeJS.Socket.md#wrap)
- [write](config_environment.NodeJS.Socket.md#write)

## Properties

### isTTY

• `Optional` **isTTY**: ``true``

#### Defined in

node_modules/@types/node/process.d.ts:135

___

### readable

• **readable**: `boolean`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[readable](config_environment.NodeJS.ReadWriteStream.md#readable)

#### Defined in

node_modules/@types/node/globals.d.ts:273

___

### writable

• **writable**: `boolean`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[writable](config_environment.NodeJS.ReadWriteStream.md#writable)

#### Defined in

node_modules/@types/node/globals.d.ts:287

## Methods

### [asyncIterator]

▸ **[asyncIterator]**(): `AsyncIterableIterator`\<`string` \| `Buffer`\>

#### Returns

`AsyncIterableIterator`\<`string` \| `Buffer`\>

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[[asyncIterator]](config_environment.NodeJS.ReadWriteStream.md#[asynciterator])

#### Defined in

node_modules/@types/node/globals.d.ts:283

___

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[[captureRejectionSymbol]](config_environment.NodeJS.ReadWriteStream.md#[capturerejectionsymbol])

#### Defined in

node_modules/@types/node/events.d.ts:540

___

### addListener

▸ **addListener**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

Alias for `emitter.on(eventName, listener)`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.1.26

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[addListener](config_environment.NodeJS.ReadWriteStream.md#addlistener)

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[emit](config_environment.NodeJS.ReadWriteStream.md#emit)

#### Defined in

node_modules/@types/node/events.d.ts:807

___

### end

▸ **end**(`cb?`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb?` | () => `void` |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[end](config_environment.NodeJS.ReadWriteStream.md#end)

#### Defined in

node_modules/@types/node/globals.d.ts:290

▸ **end**(`data`, `cb?`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `string` \| `Uint8Array` |
| `cb?` | () => `void` |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[end](config_environment.NodeJS.ReadWriteStream.md#end)

#### Defined in

node_modules/@types/node/globals.d.ts:291

▸ **end**(`str`, `encoding?`, `cb?`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `cb?` | () => `void` |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[end](config_environment.NodeJS.ReadWriteStream.md#end)

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[eventNames](config_environment.NodeJS.ReadWriteStream.md#eventnames)

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[getMaxListeners](config_environment.NodeJS.ReadWriteStream.md#getmaxlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:722

___

### isPaused

▸ **isPaused**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[isPaused](config_environment.NodeJS.ReadWriteStream.md#ispaused)

#### Defined in

node_modules/@types/node/globals.d.ts:278

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[listenerCount](config_environment.NodeJS.ReadWriteStream.md#listenercount)

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[listeners](config_environment.NodeJS.ReadWriteStream.md#listeners)

#### Defined in

node_modules/@types/node/events.d.ts:735

___

### off

▸ **off**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v10.0.0

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[off](config_environment.NodeJS.ReadWriteStream.md#off)

#### Defined in

node_modules/@types/node/events.d.ts:695

___

### on

▸ **on**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.1.101

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[on](config_environment.NodeJS.ReadWriteStream.md#on)

#### Defined in

node_modules/@types/node/events.d.ts:577

___

### once

▸ **once**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.3.0

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[once](config_environment.NodeJS.ReadWriteStream.md#once)

#### Defined in

node_modules/@types/node/events.d.ts:607

___

### pause

▸ **pause**(): [`Socket`](config_environment.NodeJS.Socket.md)

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[pause](config_environment.NodeJS.ReadWriteStream.md#pause)

#### Defined in

node_modules/@types/node/globals.d.ts:276

___

### pipe

▸ **pipe**\<`T`\>(`destination`, `options?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`WritableStream`](config_environment.NodeJS.WritableStream.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `destination` | `T` |
| `options?` | `Object` |
| `options.end?` | `boolean` |

#### Returns

`T`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[pipe](config_environment.NodeJS.ReadWriteStream.md#pipe)

#### Defined in

node_modules/@types/node/globals.d.ts:279

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v6.0.0

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[prependListener](config_environment.NodeJS.ReadWriteStream.md#prependlistener)

#### Defined in

node_modules/@types/node/events.d.ts:834

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v6.0.0

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[prependOnceListener](config_environment.NodeJS.ReadWriteStream.md#prependoncelistener)

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

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[rawListeners](config_environment.NodeJS.ReadWriteStream.md#rawlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:766

___

### read

▸ **read**(`size?`): `string` \| `Buffer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `size?` | `number` |

#### Returns

`string` \| `Buffer`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[read](config_environment.NodeJS.ReadWriteStream.md#read)

#### Defined in

node_modules/@types/node/globals.d.ts:274

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.1.26

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[removeAllListeners](config_environment.NodeJS.ReadWriteStream.md#removealllisteners)

#### Defined in

node_modules/@types/node/events.d.ts:706

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.1.26

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[removeListener](config_environment.NodeJS.ReadWriteStream.md#removelistener)

#### Defined in

node_modules/@types/node/events.d.ts:690

___

### resume

▸ **resume**(): [`Socket`](config_environment.NodeJS.Socket.md)

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[resume](config_environment.NodeJS.ReadWriteStream.md#resume)

#### Defined in

node_modules/@types/node/globals.d.ts:277

___

### setEncoding

▸ **setEncoding**(`encoding`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `encoding` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[setEncoding](config_environment.NodeJS.ReadWriteStream.md#setencoding)

#### Defined in

node_modules/@types/node/globals.d.ts:275

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`Socket`](config_environment.NodeJS.Socket.md)

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

[`Socket`](config_environment.NodeJS.Socket.md)

**`Since`**

v0.3.5

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[setMaxListeners](config_environment.NodeJS.ReadWriteStream.md#setmaxlisteners)

#### Defined in

node_modules/@types/node/events.d.ts:716

___

### unpipe

▸ **unpipe**(`destination?`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `destination?` | [`WritableStream`](config_environment.NodeJS.WritableStream.md) |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[unpipe](config_environment.NodeJS.ReadWriteStream.md#unpipe)

#### Defined in

node_modules/@types/node/globals.d.ts:280

___

### unshift

▸ **unshift**(`chunk`, `encoding?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `string` \| `Uint8Array` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |

#### Returns

`void`

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[unshift](config_environment.NodeJS.ReadWriteStream.md#unshift)

#### Defined in

node_modules/@types/node/globals.d.ts:281

___

### wrap

▸ **wrap**(`oldStream`): [`Socket`](config_environment.NodeJS.Socket.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `oldStream` | [`ReadableStream`](config_environment.NodeJS.ReadableStream.md) |

#### Returns

[`Socket`](config_environment.NodeJS.Socket.md)

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[wrap](config_environment.NodeJS.ReadWriteStream.md#wrap)

#### Defined in

node_modules/@types/node/globals.d.ts:282

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

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[write](config_environment.NodeJS.ReadWriteStream.md#write)

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

#### Inherited from

[ReadWriteStream](config_environment.NodeJS.ReadWriteStream.md).[write](config_environment.NodeJS.ReadWriteStream.md#write)

#### Defined in

node_modules/@types/node/globals.d.ts:289
