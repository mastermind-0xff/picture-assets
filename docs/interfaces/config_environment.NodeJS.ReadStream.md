[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / ReadStream

# Interface: ReadStream

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).ReadStream

## Hierarchy

- `ReadStream`

  ↳ **`ReadStream`**

## Table of contents

### Properties

- [allowHalfOpen](config_environment.NodeJS.ReadStream.md#allowhalfopen)
- [autoSelectFamilyAttemptedAddresses](config_environment.NodeJS.ReadStream.md#autoselectfamilyattemptedaddresses)
- [bufferSize](config_environment.NodeJS.ReadStream.md#buffersize)
- [bytesRead](config_environment.NodeJS.ReadStream.md#bytesread)
- [bytesWritten](config_environment.NodeJS.ReadStream.md#byteswritten)
- [closed](config_environment.NodeJS.ReadStream.md#closed)
- [connecting](config_environment.NodeJS.ReadStream.md#connecting)
- [destroyed](config_environment.NodeJS.ReadStream.md#destroyed)
- [errored](config_environment.NodeJS.ReadStream.md#errored)
- [isRaw](config_environment.NodeJS.ReadStream.md#israw)
- [isTTY](config_environment.NodeJS.ReadStream.md#istty)
- [localAddress](config_environment.NodeJS.ReadStream.md#localaddress)
- [localFamily](config_environment.NodeJS.ReadStream.md#localfamily)
- [localPort](config_environment.NodeJS.ReadStream.md#localport)
- [pending](config_environment.NodeJS.ReadStream.md#pending)
- [readable](config_environment.NodeJS.ReadStream.md#readable)
- [readableAborted](config_environment.NodeJS.ReadStream.md#readableaborted)
- [readableDidRead](config_environment.NodeJS.ReadStream.md#readabledidread)
- [readableEncoding](config_environment.NodeJS.ReadStream.md#readableencoding)
- [readableEnded](config_environment.NodeJS.ReadStream.md#readableended)
- [readableFlowing](config_environment.NodeJS.ReadStream.md#readableflowing)
- [readableHighWaterMark](config_environment.NodeJS.ReadStream.md#readablehighwatermark)
- [readableLength](config_environment.NodeJS.ReadStream.md#readablelength)
- [readableObjectMode](config_environment.NodeJS.ReadStream.md#readableobjectmode)
- [readyState](config_environment.NodeJS.ReadStream.md#readystate)
- [remoteAddress](config_environment.NodeJS.ReadStream.md#remoteaddress)
- [remoteFamily](config_environment.NodeJS.ReadStream.md#remotefamily)
- [remotePort](config_environment.NodeJS.ReadStream.md#remoteport)
- [timeout](config_environment.NodeJS.ReadStream.md#timeout)
- [writable](config_environment.NodeJS.ReadStream.md#writable)
- [writableCorked](config_environment.NodeJS.ReadStream.md#writablecorked)
- [writableEnded](config_environment.NodeJS.ReadStream.md#writableended)
- [writableFinished](config_environment.NodeJS.ReadStream.md#writablefinished)
- [writableHighWaterMark](config_environment.NodeJS.ReadStream.md#writablehighwatermark)
- [writableLength](config_environment.NodeJS.ReadStream.md#writablelength)
- [writableNeedDrain](config_environment.NodeJS.ReadStream.md#writableneeddrain)
- [writableObjectMode](config_environment.NodeJS.ReadStream.md#writableobjectmode)

### Methods

- [[asyncDispose]](config_environment.NodeJS.ReadStream.md#[asyncdispose])
- [[asyncIterator]](config_environment.NodeJS.ReadStream.md#[asynciterator])
- [[captureRejectionSymbol]](config_environment.NodeJS.ReadStream.md#[capturerejectionsymbol])
- [\_construct](config_environment.NodeJS.ReadStream.md#_construct)
- [\_destroy](config_environment.NodeJS.ReadStream.md#_destroy)
- [\_final](config_environment.NodeJS.ReadStream.md#_final)
- [\_read](config_environment.NodeJS.ReadStream.md#_read)
- [\_write](config_environment.NodeJS.ReadStream.md#_write)
- [\_writev](config_environment.NodeJS.ReadStream.md#_writev)
- [addListener](config_environment.NodeJS.ReadStream.md#addlistener)
- [address](config_environment.NodeJS.ReadStream.md#address)
- [asIndexedPairs](config_environment.NodeJS.ReadStream.md#asindexedpairs)
- [compose](config_environment.NodeJS.ReadStream.md#compose)
- [connect](config_environment.NodeJS.ReadStream.md#connect)
- [cork](config_environment.NodeJS.ReadStream.md#cork)
- [destroy](config_environment.NodeJS.ReadStream.md#destroy)
- [destroySoon](config_environment.NodeJS.ReadStream.md#destroysoon)
- [drop](config_environment.NodeJS.ReadStream.md#drop)
- [emit](config_environment.NodeJS.ReadStream.md#emit)
- [end](config_environment.NodeJS.ReadStream.md#end)
- [eventNames](config_environment.NodeJS.ReadStream.md#eventnames)
- [every](config_environment.NodeJS.ReadStream.md#every)
- [filter](config_environment.NodeJS.ReadStream.md#filter)
- [find](config_environment.NodeJS.ReadStream.md#find)
- [flatMap](config_environment.NodeJS.ReadStream.md#flatmap)
- [forEach](config_environment.NodeJS.ReadStream.md#foreach)
- [getMaxListeners](config_environment.NodeJS.ReadStream.md#getmaxlisteners)
- [isPaused](config_environment.NodeJS.ReadStream.md#ispaused)
- [iterator](config_environment.NodeJS.ReadStream.md#iterator)
- [listenerCount](config_environment.NodeJS.ReadStream.md#listenercount)
- [listeners](config_environment.NodeJS.ReadStream.md#listeners)
- [map](config_environment.NodeJS.ReadStream.md#map)
- [off](config_environment.NodeJS.ReadStream.md#off)
- [on](config_environment.NodeJS.ReadStream.md#on)
- [once](config_environment.NodeJS.ReadStream.md#once)
- [pause](config_environment.NodeJS.ReadStream.md#pause)
- [pipe](config_environment.NodeJS.ReadStream.md#pipe)
- [prependListener](config_environment.NodeJS.ReadStream.md#prependlistener)
- [prependOnceListener](config_environment.NodeJS.ReadStream.md#prependoncelistener)
- [push](config_environment.NodeJS.ReadStream.md#push)
- [rawListeners](config_environment.NodeJS.ReadStream.md#rawlisteners)
- [read](config_environment.NodeJS.ReadStream.md#read)
- [reduce](config_environment.NodeJS.ReadStream.md#reduce)
- [ref](config_environment.NodeJS.ReadStream.md#ref)
- [removeAllListeners](config_environment.NodeJS.ReadStream.md#removealllisteners)
- [removeListener](config_environment.NodeJS.ReadStream.md#removelistener)
- [resetAndDestroy](config_environment.NodeJS.ReadStream.md#resetanddestroy)
- [resume](config_environment.NodeJS.ReadStream.md#resume)
- [setDefaultEncoding](config_environment.NodeJS.ReadStream.md#setdefaultencoding)
- [setEncoding](config_environment.NodeJS.ReadStream.md#setencoding)
- [setKeepAlive](config_environment.NodeJS.ReadStream.md#setkeepalive)
- [setMaxListeners](config_environment.NodeJS.ReadStream.md#setmaxlisteners)
- [setNoDelay](config_environment.NodeJS.ReadStream.md#setnodelay)
- [setRawMode](config_environment.NodeJS.ReadStream.md#setrawmode)
- [setTimeout](config_environment.NodeJS.ReadStream.md#settimeout)
- [some](config_environment.NodeJS.ReadStream.md#some)
- [take](config_environment.NodeJS.ReadStream.md#take)
- [toArray](config_environment.NodeJS.ReadStream.md#toarray)
- [uncork](config_environment.NodeJS.ReadStream.md#uncork)
- [unpipe](config_environment.NodeJS.ReadStream.md#unpipe)
- [unref](config_environment.NodeJS.ReadStream.md#unref)
- [unshift](config_environment.NodeJS.ReadStream.md#unshift)
- [wrap](config_environment.NodeJS.ReadStream.md#wrap)
- [write](config_environment.NodeJS.ReadStream.md#write)

## Properties

### allowHalfOpen

• **allowHalfOpen**: `boolean`

If `false` then the stream will automatically end the writable side when the
readable side ends. Set initially by the `allowHalfOpen` constructor option,
which defaults to `true`.

This can be changed manually to change the half-open behavior of an existing`Duplex` stream instance, but must be changed before the `'end'` event is
emitted.

**`Since`**

v0.9.4

#### Inherited from

tty.ReadStream.allowHalfOpen

#### Defined in

node_modules/@types/node/stream.d.ts:1068

___

### autoSelectFamilyAttemptedAddresses

• `Readonly` **autoSelectFamilyAttemptedAddresses**: `string`[]

This property is only present if the family autoselection algorithm is enabled in `socket.connect(options)`
and it is an array of the addresses that have been attempted.

Each address is a string in the form of `$IP:$PORT`.
If the connection was successful, then the last address is the one that the socket is currently connected to.

**`Since`**

v19.4.0

#### Inherited from

tty.ReadStream.autoSelectFamilyAttemptedAddresses

#### Defined in

node_modules/@types/node/net.d.ts:251

___

### bufferSize

• `Readonly` **bufferSize**: `number`

This property shows the number of characters buffered for writing. The buffer
may contain strings whose length after encoding is not yet known. So this number
is only an approximation of the number of bytes in the buffer.

`net.Socket` has the property that `socket.write()` always works. This is to
help users get up and running quickly. The computer cannot always keep up
with the amount of data that is written to a socket. The network connection
simply might be too slow. Node.js will internally queue up the data written to a
socket and send it out over the wire when it is possible.

The consequence of this internal buffering is that memory may grow.
Users who experience large or growing `bufferSize` should attempt to
"throttle" the data flows in their program with `socket.pause()` and `socket.resume()`.

**`Since`**

v0.3.8

**`Deprecated`**

Since v14.6.0 - Use `writableLength` instead.

#### Inherited from

tty.ReadStream.bufferSize

#### Defined in

node_modules/@types/node/net.d.ts:269

___

### bytesRead

• `Readonly` **bytesRead**: `number`

The amount of received bytes.

**`Since`**

v0.5.3

#### Inherited from

tty.ReadStream.bytesRead

#### Defined in

node_modules/@types/node/net.d.ts:274

___

### bytesWritten

• `Readonly` **bytesWritten**: `number`

The amount of bytes sent.

**`Since`**

v0.5.3

#### Inherited from

tty.ReadStream.bytesWritten

#### Defined in

node_modules/@types/node/net.d.ts:279

___

### closed

• `Readonly` **closed**: `boolean`

#### Inherited from

tty.ReadStream.closed

#### Defined in

node_modules/@types/node/stream.d.ts:1057

___

### connecting

• `Readonly` **connecting**: `boolean`

If `true`,`socket.connect(options[, connectListener])` was
called and has not yet finished. It will stay `true` until the socket becomes
connected, then it is set to `false` and the `'connect'` event is emitted. Note
that the `socket.connect(options[, connectListener])` callback is a listener for the `'connect'` event.

**`Since`**

v6.1.0

#### Inherited from

tty.ReadStream.connecting

#### Defined in

node_modules/@types/node/net.d.ts:287

___

### destroyed

• `Readonly` **destroyed**: `boolean`

See `writable.destroyed` for further details.

#### Inherited from

tty.ReadStream.destroyed

#### Defined in

node_modules/@types/node/net.d.ts:297

___

### errored

• `Readonly` **errored**: ``null`` \| `Error`

#### Inherited from

tty.ReadStream.errored

#### Defined in

node_modules/@types/node/stream.d.ts:1058

___

### isRaw

• **isRaw**: `boolean`

A `boolean` that is `true` if the TTY is currently configured to operate as a
raw device.

This flag is always `false` when a process starts, even if the terminal is
operating in raw mode. Its value will change with subsequent calls to`setRawMode`.

**`Since`**

v0.7.7

#### Inherited from

tty.ReadStream.isRaw

#### Defined in

node_modules/@types/node/tty.d.ts:51

___

### isTTY

• **isTTY**: `boolean`

A `boolean` that is always `true` for `tty.ReadStream` instances.

**`Since`**

v0.5.8

#### Inherited from

tty.ReadStream.isTTY

#### Defined in

node_modules/@types/node/tty.d.ts:70

___

### localAddress

• `Optional` `Readonly` **localAddress**: `string`

The string representation of the local IP address the remote client is
connecting on. For example, in a server listening on `'0.0.0.0'`, if a client
connects on `'192.168.1.1'`, the value of `socket.localAddress` would be`'192.168.1.1'`.

**`Since`**

v0.9.6

#### Inherited from

tty.ReadStream.localAddress

#### Defined in

node_modules/@types/node/net.d.ts:304

___

### localFamily

• `Optional` `Readonly` **localFamily**: `string`

The string representation of the local IP family. `'IPv4'` or `'IPv6'`.

**`Since`**

v18.8.0, v16.18.0

#### Inherited from

tty.ReadStream.localFamily

#### Defined in

node_modules/@types/node/net.d.ts:314

___

### localPort

• `Optional` `Readonly` **localPort**: `number`

The numeric representation of the local port. For example, `80` or `21`.

**`Since`**

v0.9.6

#### Inherited from

tty.ReadStream.localPort

#### Defined in

node_modules/@types/node/net.d.ts:309

___

### pending

• `Readonly` **pending**: `boolean`

This is `true` if the socket is not connected yet, either because `.connect()`has not yet been called or because it is still in the process of connecting
(see `socket.connecting`).

**`Since`**

v11.2.0, v10.16.0

#### Inherited from

tty.ReadStream.pending

#### Defined in

node_modules/@types/node/net.d.ts:293

___

### readable

• **readable**: `boolean`

Is `true` if it is safe to call `readable.read()`, which means
the stream has not been destroyed or emitted `'error'` or `'end'`.

**`Since`**

v11.4.0

#### Inherited from

tty.ReadStream.readable

#### Defined in

node_modules/@types/node/stream.d.ts:70

___

### readableAborted

• `Readonly` **readableAborted**: `boolean`

Returns whether the stream was destroyed or errored before emitting `'end'`.

**`Since`**

v16.8.0

#### Inherited from

tty.ReadStream.readableAborted

#### Defined in

node_modules/@types/node/stream.d.ts:64

___

### readableDidRead

• `Readonly` **readableDidRead**: `boolean`

Returns whether `'data'` has been emitted.

**`Since`**

v16.7.0, v14.18.0

#### Inherited from

tty.ReadStream.readableDidRead

#### Defined in

node_modules/@types/node/stream.d.ts:76

___

### readableEncoding

• `Readonly` **readableEncoding**: ``null`` \| [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding)

Getter for the property `encoding` of a given `Readable` stream. The `encoding`property can be set using the `readable.setEncoding()` method.

**`Since`**

v12.7.0

#### Inherited from

tty.ReadStream.readableEncoding

#### Defined in

node_modules/@types/node/stream.d.ts:81

___

### readableEnded

• `Readonly` **readableEnded**: `boolean`

Becomes `true` when `'end'` event is emitted.

**`Since`**

v12.9.0

#### Inherited from

tty.ReadStream.readableEnded

#### Defined in

node_modules/@types/node/stream.d.ts:86

___

### readableFlowing

• `Readonly` **readableFlowing**: ``null`` \| `boolean`

This property reflects the current state of a `Readable` stream as described
in the `Three states` section.

**`Since`**

v9.4.0

#### Inherited from

tty.ReadStream.readableFlowing

#### Defined in

node_modules/@types/node/stream.d.ts:92

___

### readableHighWaterMark

• `Readonly` **readableHighWaterMark**: `number`

Returns the value of `highWaterMark` passed when creating this `Readable`.

**`Since`**

v9.3.0

#### Inherited from

tty.ReadStream.readableHighWaterMark

#### Defined in

node_modules/@types/node/stream.d.ts:97

___

### readableLength

• `Readonly` **readableLength**: `number`

This property contains the number of bytes (or objects) in the queue
ready to be read. The value provides introspection data regarding
the status of the `highWaterMark`.

**`Since`**

v9.4.0

#### Inherited from

tty.ReadStream.readableLength

#### Defined in

node_modules/@types/node/stream.d.ts:104

___

### readableObjectMode

• `Readonly` **readableObjectMode**: `boolean`

Getter for the property `objectMode` of a given `Readable` stream.

**`Since`**

v12.3.0

#### Inherited from

tty.ReadStream.readableObjectMode

#### Defined in

node_modules/@types/node/stream.d.ts:109

___

### readyState

• `Readonly` **readyState**: `SocketReadyState`

This property represents the state of the connection as a string.

* If the stream is connecting `socket.readyState` is `opening`.
* If the stream is readable and writable, it is `open`.
* If the stream is readable and not writable, it is `readOnly`.
* If the stream is not readable and writable, it is `writeOnly`.

**`Since`**

v0.5.0

#### Inherited from

tty.ReadStream.readyState

#### Defined in

node_modules/@types/node/net.d.ts:324

___

### remoteAddress

• `Optional` `Readonly` **remoteAddress**: `string`

The string representation of the remote IP address. For example,`'74.125.127.100'` or `'2001:4860:a005::68'`. Value may be `undefined` if
the socket is destroyed (for example, if the client disconnected).

**`Since`**

v0.5.10

#### Inherited from

tty.ReadStream.remoteAddress

#### Defined in

node_modules/@types/node/net.d.ts:330

___

### remoteFamily

• `Optional` `Readonly` **remoteFamily**: `string`

The string representation of the remote IP family. `'IPv4'` or `'IPv6'`. Value may be `undefined` if
the socket is destroyed (for example, if the client disconnected).

**`Since`**

v0.11.14

#### Inherited from

tty.ReadStream.remoteFamily

#### Defined in

node_modules/@types/node/net.d.ts:336

___

### remotePort

• `Optional` `Readonly` **remotePort**: `number`

The numeric representation of the remote port. For example, `80` or `21`. Value may be `undefined` if
the socket is destroyed (for example, if the client disconnected).

**`Since`**

v0.5.10

#### Inherited from

tty.ReadStream.remotePort

#### Defined in

node_modules/@types/node/net.d.ts:342

___

### timeout

• `Optional` `Readonly` **timeout**: `number`

The socket timeout in milliseconds as set by `socket.setTimeout()`.
It is `undefined` if a timeout has not been set.

**`Since`**

v10.7.0

#### Inherited from

tty.ReadStream.timeout

#### Defined in

node_modules/@types/node/net.d.ts:348

___

### writable

• `Readonly` **writable**: `boolean`

#### Inherited from

tty.ReadStream.writable

#### Defined in

node_modules/@types/node/stream.d.ts:1049

___

### writableCorked

• `Readonly` **writableCorked**: `number`

#### Inherited from

tty.ReadStream.writableCorked

#### Defined in

node_modules/@types/node/stream.d.ts:1055

___

### writableEnded

• `Readonly` **writableEnded**: `boolean`

#### Inherited from

tty.ReadStream.writableEnded

#### Defined in

node_modules/@types/node/stream.d.ts:1050

___

### writableFinished

• `Readonly` **writableFinished**: `boolean`

#### Inherited from

tty.ReadStream.writableFinished

#### Defined in

node_modules/@types/node/stream.d.ts:1051

___

### writableHighWaterMark

• `Readonly` **writableHighWaterMark**: `number`

#### Inherited from

tty.ReadStream.writableHighWaterMark

#### Defined in

node_modules/@types/node/stream.d.ts:1052

___

### writableLength

• `Readonly` **writableLength**: `number`

#### Inherited from

tty.ReadStream.writableLength

#### Defined in

node_modules/@types/node/stream.d.ts:1053

___

### writableNeedDrain

• `Readonly` **writableNeedDrain**: `boolean`

#### Inherited from

tty.ReadStream.writableNeedDrain

#### Defined in

node_modules/@types/node/stream.d.ts:1056

___

### writableObjectMode

• `Readonly` **writableObjectMode**: `boolean`

#### Inherited from

tty.ReadStream.writableObjectMode

#### Defined in

node_modules/@types/node/stream.d.ts:1054

## Methods

### [asyncDispose]

▸ **[asyncDispose]**(): `Promise`\<`void`\>

Calls `readable.destroy()` with an `AbortError` and returns a promise that fulfills when the stream is finished.

#### Returns

`Promise`\<`void`\>

**`Since`**

v20.4.0

#### Inherited from

tty.ReadStream.[asyncDispose]

#### Defined in

node_modules/@types/node/stream.d.ts:651

___

### [asyncIterator]

▸ **[asyncIterator]**(): `AsyncIterableIterator`\<`any`\>

#### Returns

`AsyncIterableIterator`\<`any`\>

#### Inherited from

tty.ReadStream.[asyncIterator]

#### Defined in

node_modules/@types/node/stream.d.ts:646

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

tty.ReadStream.[captureRejectionSymbol]

#### Defined in

node_modules/@types/node/events.d.ts:112

___

### \_construct

▸ **_construct**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`error?`: ``null`` \| `Error`) => `void` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_construct

#### Defined in

node_modules/@types/node/stream.d.ts:126

___

### \_destroy

▸ **_destroy**(`error`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | ``null`` \| `Error` |
| `callback` | (`error?`: ``null`` \| `Error`) => `void` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_destroy

#### Defined in

node_modules/@types/node/stream.d.ts:1111

___

### \_final

▸ **_final**(`callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `callback` | (`error?`: ``null`` \| `Error`) => `void` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_final

#### Defined in

node_modules/@types/node/stream.d.ts:1112

___

### \_read

▸ **_read**(`size`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `size` | `number` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_read

#### Defined in

node_modules/@types/node/stream.d.ts:127

___

### \_write

▸ **_write**(`chunk`, `encoding`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `encoding` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `callback` | (`error?`: ``null`` \| `Error`) => `void` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_write

#### Defined in

node_modules/@types/node/stream.d.ts:1103

___

### \_writev

▸ **_writev**(`chunks`, `callback`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunks` | \{ `chunk`: `any` ; `encoding`: [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding)  }[] |
| `callback` | (`error?`: ``null`` \| `Error`) => `void` |

#### Returns

`void`

#### Inherited from

tty.ReadStream.\_writev

#### Defined in

node_modules/@types/node/stream.d.ts:1104

___

### addListener

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

events.EventEmitter
  1. close
  2. connect
  3. data
  4. drain
  5. end
  6. error
  7. lookup
  8. ready
  9. timeout

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:374

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | (`hadError`: `boolean`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:375

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:376

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`data`: `Buffer`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:377

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:378

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:379

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:380

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `listener` | (`err`: `Error`, `address`: `string`, `family`: `string` \| `number`, `host`: `string`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:381

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:385

▸ **addListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.addListener

#### Defined in

node_modules/@types/node/net.d.ts:386

___

### address

▸ **address**(): {} \| `AddressInfo`

Returns the bound `address`, the address `family` name and `port` of the
socket as reported by the operating system:`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

#### Returns

{} \| `AddressInfo`

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.address

#### Defined in

node_modules/@types/node/net.d.ts:228

___

### asIndexedPairs

▸ **asIndexedPairs**(`options?`): `Readable`

This method returns a new stream with chunks of the underlying stream paired with a counter
in the form `[index, chunk]`. The first index value is `0` and it increases by 1 for each chunk produced.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> |

#### Returns

`Readable`

a stream of indexed pairs.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.asIndexedPairs

#### Defined in

node_modules/@types/node/stream.d.ts:541

___

### compose

▸ **compose**\<`T`\>(`stream`, `options?`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ReadableStream`](config_environment.NodeJS.ReadableStream.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `stream` | `T` \| `ComposeFnParam` \| `Iterable`\<`T`\> \| `AsyncIterable`\<`T`\> |
| `options?` | `Object` |
| `options.signal` | `AbortSignal` |

#### Returns

`T`

#### Inherited from

tty.ReadStream.compose

#### Defined in

node_modules/@types/node/stream.d.ts:35

___

### connect

▸ **connect**(`options`, `connectionListener?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Initiate a connection on a given socket.

Possible signatures:

* `socket.connect(options[, connectListener])`
* `socket.connect(path[, connectListener])` for `IPC` connections.
* `socket.connect(port[, host][, connectListener])` for TCP connections.
* Returns: `net.Socket` The socket itself.

This function is asynchronous. When the connection is established, the `'connect'` event will be emitted. If there is a problem connecting,
instead of a `'connect'` event, an `'error'` event will be emitted with
the error passed to the `'error'` listener.
The last parameter `connectListener`, if supplied, will be added as a listener
for the `'connect'` event **once**.

This function should only be used for reconnecting a socket after`'close'` has been emitted or otherwise it may lead to undefined
behavior.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `SocketConnectOpts` |
| `connectionListener?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.connect

#### Defined in

node_modules/@types/node/net.d.ts:136

▸ **connect**(`port`, `host`, `connectionListener?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `number` |
| `host` | `string` |
| `connectionListener?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.connect

#### Defined in

node_modules/@types/node/net.d.ts:137

▸ **connect**(`port`, `connectionListener?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `port` | `number` |
| `connectionListener?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.connect

#### Defined in

node_modules/@types/node/net.d.ts:138

▸ **connect**(`path`, `connectionListener?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `connectionListener?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.connect

#### Defined in

node_modules/@types/node/net.d.ts:139

___

### cork

▸ **cork**(): `void`

#### Returns

`void`

#### Inherited from

tty.ReadStream.cork

#### Defined in

node_modules/@types/node/stream.d.ts:1119

___

### destroy

▸ **destroy**(`error?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'`event (unless `emitClose` is set to `false`). After this call, the readable
stream will release any internal resources and subsequent calls to `push()`will be ignored.

Once `destroy()` has been called any further calls will be a no-op and no
further errors except from `_destroy()` may be emitted as `'error'`.

Implementors should not override this method, but instead implement `readable._destroy()`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error?` | `Error` | Error which will be passed as payload in `'error'` event |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v8.0.0

#### Inherited from

tty.ReadStream.destroy

#### Defined in

node_modules/@types/node/stream.d.ts:578

___

### destroySoon

▸ **destroySoon**(): `void`

Destroys the socket after all data is written. If the `finish` event was already emitted the socket is destroyed immediately.
If the socket is still writable it implicitly calls `socket.end()`.

#### Returns

`void`

**`Since`**

v0.3.4

#### Inherited from

tty.ReadStream.destroySoon

#### Defined in

node_modules/@types/node/net.d.ts:99

___

### drop

▸ **drop**(`limit`, `options?`): `Readable`

This method returns a new stream with the first *limit* chunks dropped from the start.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `limit` | `number` | the number of chunks to drop from the readable. |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> | - |

#### Returns

`Readable`

a stream with *limit* chunks dropped from the start.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.drop

#### Defined in

node_modules/@types/node/stream.d.ts:527

___

### emit

▸ **emit**(`event`, `...args`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:387

▸ **emit**(`event`, `hadError`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `hadError` | `boolean` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:388

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:389

▸ **emit**(`event`, `data`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `data` | `Buffer` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:390

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:391

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:392

▸ **emit**(`event`, `err`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `err` | `Error` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:393

▸ **emit**(`event`, `err`, `address`, `family`, `host`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `err` | `Error` |
| `address` | `string` |
| `family` | `string` \| `number` |
| `host` | `string` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:394

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:395

▸ **emit**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.emit

#### Defined in

node_modules/@types/node/net.d.ts:396

___

### end

▸ **end**(`callback?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Half-closes the socket. i.e., it sends a FIN packet. It is possible the
server will still send some data.

See `writable.end()` for further details.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callback?` | () => `void` | Optional callback for when the socket is finished. |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.end

#### Defined in

node_modules/@types/node/net.d.ts:359

▸ **end**(`buffer`, `callback?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `buffer` | `string` \| `Uint8Array` |
| `callback?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.end

#### Defined in

node_modules/@types/node/net.d.ts:360

▸ **end**(`str`, `encoding?`, `callback?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` \| `Uint8Array` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `callback?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.end

#### Defined in

node_modules/@types/node/net.d.ts:361

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

tty.ReadStream.eventNames

#### Defined in

node_modules/@types/node/events.d.ts:870

___

### every

▸ **every**(`fn`, `options?`): `Promise`\<`boolean`\>

This method is similar to `Array.prototype.every` and calls *fn* on each chunk in the stream
to check if all awaited return values are truthy value for *fn*. Once an *fn* call on a chunk
`await`ed return value is falsy, the stream is destroyed and the promise is fulfilled with `false`.
If all of the *fn* calls on the chunks return a truthy value, the promise is fulfilled with `true`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `boolean` \| `Promise`\<`boolean`\> | a function to call on each chunk of the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Promise`\<`boolean`\>

a promise evaluating to `true` if *fn* returned a truthy value for every one of the chunks.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.every

#### Defined in

node_modules/@types/node/stream.d.ts:506

___

### filter

▸ **filter**(`fn`, `options?`): `Readable`

This method allows filtering the stream. For each chunk in the stream the *fn* function will be called
and if it returns a truthy value, the chunk will be passed to the result stream.
If the *fn* function returns a promise - that promise will be `await`ed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `boolean` \| `Promise`\<`boolean`\> | a function to filter chunks from the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Readable`

a stream filtered with the predicate *fn*.

**`Since`**

v17.4.0, v16.14.0

#### Inherited from

tty.ReadStream.filter

#### Defined in

node_modules/@types/node/stream.d.ts:434

___

### find

▸ **find**\<`T`\>(`fn`, `options?`): `Promise`\<`undefined` \| `T`\>

This method is similar to `Array.prototype.find` and calls *fn* on each chunk in the stream
to find a chunk with a truthy value for *fn*. Once an *fn* call's awaited return value is truthy,
the stream is destroyed and the promise is fulfilled with value for which *fn* returned a truthy value.
If all of the *fn* calls on the chunks return a falsy value, the promise is fulfilled with `undefined`.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => data is T | a function to call on each chunk of the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Promise`\<`undefined` \| `T`\>

a promise evaluating to the first chunk for which *fn* evaluated with a truthy value,
or `undefined` if no element was found.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.find

#### Defined in

node_modules/@types/node/stream.d.ts:489

▸ **find**(`fn`, `options?`): `Promise`\<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `boolean` \| `Promise`\<`boolean`\> |
| `options?` | `ArrayOptions` |

#### Returns

`Promise`\<`any`\>

#### Inherited from

tty.ReadStream.find

#### Defined in

node_modules/@types/node/stream.d.ts:493

___

### flatMap

▸ **flatMap**(`fn`, `options?`): `Readable`

This method returns a new stream by applying the given callback to each chunk of the stream
and then flattening the result.

It is possible to return a stream or another iterable or async iterable from *fn* and the result streams
will be merged (flattened) into the returned stream.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `any` | a function to map over every chunk in the stream. May be async. May be a stream or generator. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Readable`

a stream flat-mapped with the function *fn*.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.flatMap

#### Defined in

node_modules/@types/node/stream.d.ts:520

___

### forEach

▸ **forEach**(`fn`, `options?`): `Promise`\<`void`\>

This method allows iterating a stream. For each chunk in the stream the *fn* function will be called.
If the *fn* function returns a promise - that promise will be `await`ed.

This method is different from `for await...of` loops in that it can optionally process chunks concurrently.
In addition, a `forEach` iteration can only be stopped by having passed a `signal` option
and aborting the related AbortController while `for await...of` can be stopped with `break` or `return`.
In either case the stream will be destroyed.

This method is different from listening to the `'data'` event in that it uses the `readable` event
in the underlying machinary and can limit the number of concurrent *fn* calls.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `void` \| `Promise`\<`void`\> | a function to call on each chunk of the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Promise`\<`void`\>

a promise for when the stream has finished.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.forEach

#### Defined in

node_modules/@types/node/stream.d.ts:453

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

tty.ReadStream.getMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:722

___

### isPaused

▸ **isPaused**(): `boolean`

The `readable.isPaused()` method returns the current operating state of the`Readable`. This is used primarily by the mechanism that underlies the`readable.pipe()` method. In most
typical cases, there will be no reason to
use this method directly.

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```

#### Returns

`boolean`

**`Since`**

v0.11.14

#### Inherited from

tty.ReadStream.isPaused

#### Defined in

node_modules/@types/node/stream.d.ts:287

___

### iterator

▸ **iterator**(`options?`): `AsyncIterableIterator`\<`any`\>

The iterator created by this method gives users the option to cancel the destruction
of the stream if the `for await...of` loop is exited by `return`, `break`, or `throw`,
or if the iterator should destroy the stream if the stream emitted an error during iteration.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `Object` | - |
| `options.destroyOnReturn?` | `boolean` | When set to `false`, calling `return` on the async iterator, or exiting a `for await...of` iteration using a `break`, `return`, or `throw` will not destroy the stream. **Default: `true`**. |

#### Returns

`AsyncIterableIterator`\<`any`\>

**`Since`**

v16.3.0

#### Inherited from

tty.ReadStream.iterator

#### Defined in

node_modules/@types/node/stream.d.ts:417

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

tty.ReadStream.listenerCount

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

tty.ReadStream.listeners

#### Defined in

node_modules/@types/node/events.d.ts:735

___

### map

▸ **map**(`fn`, `options?`): `Readable`

This method allows mapping over the stream. The *fn* function will be called for every chunk in the stream.
If the *fn* function returns a promise - that promise will be `await`ed before being passed to the result stream.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `any` | a function to map over every chunk in the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Readable`

a stream mapped with the function *fn*.

**`Since`**

v17.4.0, v16.14.0

#### Inherited from

tty.ReadStream.map

#### Defined in

node_modules/@types/node/stream.d.ts:425

___

### off

▸ **off**(`eventName`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Alias for `emitter.removeListener()`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v10.0.0

#### Inherited from

tty.ReadStream.off

#### Defined in

node_modules/@types/node/events.d.ts:695

___

### on

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:397

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | (`hadError`: `boolean`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:398

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:399

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`data`: `Buffer`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:400

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:401

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:402

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:403

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `listener` | (`err`: `Error`, `address`: `string`, `family`: `string` \| `number`, `host`: `string`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:404

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:408

▸ **on**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.on

#### Defined in

node_modules/@types/node/net.d.ts:409

___

### once

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:410

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | (`hadError`: `boolean`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:411

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:412

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`data`: `Buffer`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:413

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:414

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:415

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:416

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `listener` | (`err`: `Error`, `address`: `string`, `family`: `string` \| `number`, `host`: `string`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:417

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:421

▸ **once**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.once

#### Defined in

node_modules/@types/node/net.d.ts:422

___

### pause

▸ **pause**(): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Pauses the reading of data. That is, `'data'` events will not be emitted.
Useful to throttle back an upload.

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

#### Inherited from

tty.ReadStream.pause

#### Defined in

node_modules/@types/node/net.d.ts:151

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

tty.ReadStream.pipe

#### Defined in

node_modules/@types/node/stream.d.ts:29

___

### prependListener

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:423

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | (`hadError`: `boolean`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:424

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:425

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`data`: `Buffer`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:426

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:427

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:428

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:429

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `listener` | (`err`: `Error`, `address`: `string`, `family`: `string` \| `number`, `host`: `string`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:430

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:434

▸ **prependListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependListener

#### Defined in

node_modules/@types/node/net.d.ts:435

___

### prependOnceListener

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:436

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | (`hadError`: `boolean`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:437

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"connect"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:438

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`data`: `Buffer`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:439

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:440

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:441

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:442

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"lookup"`` |
| `listener` | (`err`: `Error`, `address`: `string`, `family`: `string` \| `number`, `host`: `string`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:443

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"ready"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:447

▸ **prependOnceListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"timeout"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.prependOnceListener

#### Defined in

node_modules/@types/node/net.d.ts:448

___

### push

▸ **push**(`chunk`, `encoding?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `any` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.push

#### Defined in

node_modules/@types/node/stream.d.ts:407

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

tty.ReadStream.rawListeners

#### Defined in

node_modules/@types/node/events.d.ts:766

___

### read

▸ **read**(`size?`): `any`

The `readable.read()` method reads data out of the internal buffer and
returns it. If no data is available to be read, `null` is returned. By default,
the data is returned as a `Buffer` object unless an encoding has been
specified using the `readable.setEncoding()` method or the stream is operating
in object mode.

The optional `size` argument specifies a specific number of bytes to read. If`size` bytes are not available to be read, `null` will be returned _unless_the stream has ended, in which
case all of the data remaining in the internal
buffer will be returned.

If the `size` argument is not specified, all of the data contained in the
internal buffer will be returned.

The `size` argument must be less than or equal to 1 GiB.

The `readable.read()` method should only be called on `Readable` streams
operating in paused mode. In flowing mode, `readable.read()` is called
automatically until the internal buffer is fully drained.

```js
const readable = getReadableStreamSomehow();

// 'readable' may be triggered multiple times as data is buffered in
readable.on('readable', () => {
  let chunk;
  console.log('Stream is readable (new data received in buffer)');
  // Use a loop to make sure we read all currently available data
  while (null !== (chunk = readable.read())) {
    console.log(`Read ${chunk.length} bytes of data...`);
  }
});

// 'end' will be triggered once when there is no more data available
readable.on('end', () => {
  console.log('Reached end of stream.');
});
```

Each call to `readable.read()` returns a chunk of data, or `null`. The chunks
are not concatenated. A `while` loop is necessary to consume all data
currently in the buffer. When reading a large file `.read()` may return `null`,
having consumed all buffered content so far, but there is still more data to
come not yet buffered. In this case a new `'readable'` event will be emitted
when there is more data in the buffer. Finally the `'end'` event will be
emitted when there is no more data to come.

Therefore to read a file's whole contents from a `readable`, it is necessary
to collect chunks across multiple `'readable'` events:

```js
const chunks = [];

readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    chunks.push(chunk);
  }
});

readable.on('end', () => {
  const content = chunks.join('');
});
```

A `Readable` stream in object mode will always return a single item from
a call to `readable.read(size)`, regardless of the value of the`size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will
also be emitted.

Calling [read](config_environment.NodeJS.ReadStream.md#read) after the `'end'` event has
been emitted will return `null`. No runtime error will be raised.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `size?` | `number` | Optional argument to specify how much data to read. |

#### Returns

`any`

**`Since`**

v0.9.4

#### Inherited from

tty.ReadStream.read

#### Defined in

node_modules/@types/node/stream.d.ts:204

___

### reduce

▸ **reduce**\<`T`\>(`fn`, `initial?`, `options?`): `Promise`\<`T`\>

This method calls *fn* on each chunk of the stream in order, passing it the result from the calculation
on the previous element. It returns a promise for the final value of the reduction.

If no *initial* value is supplied the first chunk of the stream is used as the initial value.
If the stream is empty, the promise is rejected with a `TypeError` with the `ERR_INVALID_ARGS` code property.

The reducer function iterates the stream element-by-element which means that there is no *concurrency* parameter
or parallelism. To perform a reduce concurrently, you can extract the async function to `readable.map` method.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`previous`: `any`, `data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `T` | a reducer function to call over every chunk in the stream. Async or not. |
| `initial?` | `undefined` | the initial value to use in the reduction. |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> | - |

#### Returns

`Promise`\<`T`\>

a promise for the final value of the reduction.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.reduce

#### Defined in

node_modules/@types/node/stream.d.ts:556

▸ **reduce**\<`T`\>(`fn`, `initial`, `options?`): `Promise`\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `any` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `fn` | (`previous`: `T`, `data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `T` |
| `initial` | `T` |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> |

#### Returns

`Promise`\<`T`\>

#### Inherited from

tty.ReadStream.reduce

#### Defined in

node_modules/@types/node/stream.d.ts:561

___

### ref

▸ **ref**(): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will _not_ let the program exit if it's the only socket left (the default behavior).
If the socket is `ref`ed calling `ref` again will have no effect.

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.9.1

#### Inherited from

tty.ReadStream.ref

#### Defined in

node_modules/@types/node/net.d.ts:242

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

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

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v0.1.26

#### Inherited from

tty.ReadStream.removeAllListeners

#### Defined in

node_modules/@types/node/events.d.ts:706

___

### removeListener

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"close"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1232

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"data"`` |
| `listener` | (`chunk`: `any`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1233

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"drain"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1234

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"end"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1235

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"error"`` |
| `listener` | (`err`: `Error`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1236

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"finish"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1237

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pause"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1238

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"pipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1239

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"readable"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1240

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"resume"`` |
| `listener` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1241

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"unpipe"`` |
| `listener` | (`src`: `Readable`) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1242

▸ **removeListener**(`event`, `listener`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.removeListener

#### Defined in

node_modules/@types/node/stream.d.ts:1243

___

### resetAndDestroy

▸ **resetAndDestroy**(): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Close the TCP connection by sending an RST packet and destroy the stream.
If this TCP socket is in connecting status, it will send an RST packet and destroy this TCP socket once it is connected.
Otherwise, it will call `socket.destroy` with an `ERR_SOCKET_CLOSED` Error.
If this is not a TCP socket (for example, a pipe), calling this method will immediately throw an `ERR_INVALID_HANDLE_TYPE` Error.

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v18.3.0, v16.17.0

#### Inherited from

tty.ReadStream.resetAndDestroy

#### Defined in

node_modules/@types/node/net.d.ts:159

___

### resume

▸ **resume**(): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Resumes reading after a call to `socket.pause()`.

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

#### Inherited from

tty.ReadStream.resume

#### Defined in

node_modules/@types/node/net.d.ts:164

___

### setDefaultEncoding

▸ **setDefaultEncoding**(`encoding`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `encoding` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

#### Inherited from

tty.ReadStream.setDefaultEncoding

#### Defined in

node_modules/@types/node/stream.d.ts:1115

___

### setEncoding

▸ **setEncoding**(`encoding?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Set the encoding for the socket as a `Readable Stream`. See `readable.setEncoding()` for more information.

#### Parameters

| Name | Type |
| :------ | :------ |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.setEncoding

#### Defined in

node_modules/@types/node/net.d.ts:145

___

### setKeepAlive

▸ **setKeepAlive**(`enable?`, `initialDelay?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Enable/disable keep-alive functionality, and optionally set the initial
delay before the first keepalive probe is sent on an idle socket.

Set `initialDelay` (in milliseconds) to set the delay between the last
data packet received and the first keepalive probe. Setting `0` for`initialDelay` will leave the value unchanged from the default
(or previous) setting.

Enabling the keep-alive functionality will set the following socket options:

* `SO_KEEPALIVE=1`
* `TCP_KEEPIDLE=initialDelay`
* `TCP_KEEPCNT=10`
* `TCP_KEEPINTVL=1`

#### Parameters

| Name | Type |
| :------ | :------ |
| `enable?` | `boolean` |
| `initialDelay?` | `number` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.1.92

#### Inherited from

tty.ReadStream.setKeepAlive

#### Defined in

node_modules/@types/node/net.d.ts:222

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

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

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v0.3.5

#### Inherited from

tty.ReadStream.setMaxListeners

#### Defined in

node_modules/@types/node/events.d.ts:716

___

### setNoDelay

▸ **setNoDelay**(`noDelay?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Enable/disable the use of Nagle's algorithm.

When a TCP connection is created, it will have Nagle's algorithm enabled.

Nagle's algorithm delays data before it is sent via the network. It attempts
to optimize throughput at the expense of latency.

Passing `true` for `noDelay` or not passing an argument will disable Nagle's
algorithm for the socket. Passing `false` for `noDelay` will enable Nagle's
algorithm.

#### Parameters

| Name | Type |
| :------ | :------ |
| `noDelay?` | `boolean` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.setNoDelay

#### Defined in

node_modules/@types/node/net.d.ts:202

___

### setRawMode

▸ **setRawMode**(`mode`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Allows configuration of `tty.ReadStream` so that it operates as a raw device.

When in raw mode, input is always available character-by-character, not
including modifiers. Additionally, all special processing of characters by the
terminal is disabled, including echoing input
characters. Ctrl+C will no longer cause a `SIGINT` when
in this mode.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `mode` | `boolean` | If `true`, configures the `tty.ReadStream` to operate as a raw device. If `false`, configures the `tty.ReadStream` to operate in its default mode. The `readStream.isRaw` property will be set to the resulting mode. |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The read stream instance.

**`Since`**

v0.7.7

#### Inherited from

tty.ReadStream.setRawMode

#### Defined in

node_modules/@types/node/tty.d.ts:65

___

### setTimeout

▸ **setTimeout**(`timeout`, `callback?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Sets the socket to timeout after `timeout` milliseconds of inactivity on
the socket. By default `net.Socket` do not have a timeout.

When an idle timeout is triggered the socket will receive a `'timeout'` event but the connection will not be severed. The user must manually call `socket.end()` or `socket.destroy()` to
end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

If `timeout` is 0, then the existing idle timeout is disabled.

The optional `callback` parameter will be added as a one-time listener for the `'timeout'` event.

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeout` | `number` |
| `callback?` | () => `void` |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.setTimeout

#### Defined in

node_modules/@types/node/net.d.ts:186

___

### some

▸ **some**(`fn`, `options?`): `Promise`\<`boolean`\>

This method is similar to `Array.prototype.some` and calls *fn* on each chunk in the stream
until the awaited return value is `true` (or any truthy value). Once an *fn* call on a chunk
`await`ed return value is truthy, the stream is destroyed and the promise is fulfilled with `true`.
If none of the *fn* calls on the chunks return a truthy value, the promise is fulfilled with `false`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fn` | (`data`: `any`, `options?`: `Pick`\<`ArrayOptions`, ``"signal"``\>) => `boolean` \| `Promise`\<`boolean`\> | a function to call on each chunk of the stream. Async or not. |
| `options?` | `ArrayOptions` | - |

#### Returns

`Promise`\<`boolean`\>

a promise evaluating to `true` if *fn* returned a truthy value for at least one of the chunks.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.some

#### Defined in

node_modules/@types/node/stream.d.ts:475

___

### take

▸ **take**(`limit`, `options?`): `Readable`

This method returns a new stream with the first *limit* chunks.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `limit` | `number` | the number of chunks to take from the readable. |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> | - |

#### Returns

`Readable`

a stream with *limit* chunks taken.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.take

#### Defined in

node_modules/@types/node/stream.d.ts:534

___

### toArray

▸ **toArray**(`options?`): `Promise`\<`any`[]\>

This method allows easily obtaining the contents of a stream.

As this method reads the entire stream into memory, it negates the benefits of streams. It's intended
for interoperability and convenience, not as the primary way to consume streams.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options?` | `Pick`\<`ArrayOptions`, ``"signal"``\> |

#### Returns

`Promise`\<`any`[]\>

a promise containing an array with the contents of the stream.

**`Since`**

v17.5.0

#### Inherited from

tty.ReadStream.toArray

#### Defined in

node_modules/@types/node/stream.d.ts:465

___

### uncork

▸ **uncork**(): `void`

#### Returns

`void`

#### Inherited from

tty.ReadStream.uncork

#### Defined in

node_modules/@types/node/stream.d.ts:1120

___

### unpipe

▸ **unpipe**(`destination?`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

The `readable.unpipe()` method detaches a `Writable` stream previously attached
using the [pipe](config_environment.NodeJS.ReadStream.md#pipe) method.

If the `destination` is not specified, then _all_ pipes are detached.

If the `destination` is specified, but no pipe is set up for it, then
the method does nothing.

```js
const fs = require('node:fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second.
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
  writable.end();
}, 1000);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `destination?` | [`WritableStream`](config_environment.NodeJS.WritableStream.md) | Optional specific stream to unpipe |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v0.9.4

#### Inherited from

tty.ReadStream.unpipe

#### Defined in

node_modules/@types/node/stream.d.ts:314

___

### unref

▸ **unref**(): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Calling `unref()` on a socket will allow the program to exit if this is the only
active socket in the event system. If the socket is already `unref`ed calling`unref()` again will have no effect.

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

The socket itself.

**`Since`**

v0.9.1

#### Inherited from

tty.ReadStream.unref

#### Defined in

node_modules/@types/node/net.d.ts:235

___

### unshift

▸ **unshift**(`chunk`, `encoding?`): `void`

Passing `chunk` as `null` signals the end of the stream (EOF) and behaves the
same as `readable.push(null)`, after which no more data can be written. The EOF
signal is put at the end of the buffer and any buffered data will still be
flushed.

The `readable.unshift()` method pushes a chunk of data back into the internal
buffer. This is useful in certain situations where a stream is being consumed by
code that needs to "un-consume" some amount of data that it has optimistically
pulled out of the source, so that the data can be passed on to some other party.

The `stream.unshift(chunk)` method cannot be called after the `'end'` event
has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to
use of a `Transform` stream instead. See the `API for stream implementers` section for more information.

```js
// Pull off a header delimited by \n\n.
// Use unshift() if we get too much.
// Call the callback with (error, header, stream).
const { StringDecoder } = require('node:string_decoder');
function parseHeader(stream, callback) {
  stream.on('error', callback);
  stream.on('readable', onReadable);
  const decoder = new StringDecoder('utf8');
  let header = '';
  function onReadable() {
    let chunk;
    while (null !== (chunk = stream.read())) {
      const str = decoder.write(chunk);
      if (str.includes('\n\n')) {
        // Found the header boundary.
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // Remove the 'readable' listener before unshifting.
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // Now the body of the message can be read from the stream.
        callback(null, header, stream);
        return;
      }
      // Still reading the header.
      header += str;
    }
  }
}
```

Unlike [push](config_environment.NodeJS.ReadStream.md#push), `stream.unshift(chunk)` will not
end the reading process by resetting the internal reading state of the stream.
This can cause unexpected results if `readable.unshift()` is called during a
read (i.e. from within a [_read](config_environment.NodeJS.ReadStream.md#_read) implementation on a
custom stream). Following the call to `readable.unshift()` with an immediate [push](config_environment.NodeJS.ReadStream.md#push) will reset the reading state appropriately,
however it is best to simply avoid calling `readable.unshift()` while in the
process of performing a read.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chunk` | `any` | Chunk of data to unshift onto the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer`, `Uint8Array`, or `null`. For object mode streams, `chunk` may be any JavaScript value. |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) | Encoding of string chunks. Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`. |

#### Returns

`void`

**`Since`**

v0.9.11

#### Inherited from

tty.ReadStream.unshift

#### Defined in

node_modules/@types/node/stream.d.ts:380

___

### wrap

▸ **wrap**(`stream`): [`ReadStream`](config_environment.NodeJS.ReadStream.md)

Prior to Node.js 0.10, streams did not implement the entire `node:stream`module API as it is currently defined. (See `Compatibility` for more
information.)

When using an older Node.js library that emits `'data'` events and has a [pause](config_environment.NodeJS.ReadStream.md#pause) method that is advisory only, the`readable.wrap()` method can be used to create a `Readable`
stream that uses
the old stream as its data source.

It will rarely be necessary to use `readable.wrap()` but the method has been
provided as a convenience for interacting with older Node.js applications and
libraries.

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('node:stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stream` | [`ReadableStream`](config_environment.NodeJS.ReadableStream.md) | An "old style" readable stream |

#### Returns

[`ReadStream`](config_environment.NodeJS.ReadStream.md)

**`Since`**

v0.9.4

#### Inherited from

tty.ReadStream.wrap

#### Defined in

node_modules/@types/node/stream.d.ts:406

___

### write

▸ **write**(`buffer`, `cb?`): `boolean`

Sends data on the socket. The second parameter specifies the encoding in the
case of a string. It defaults to UTF8 encoding.

Returns `true` if the entire data was flushed successfully to the kernel
buffer. Returns `false` if all or part of the data was queued in user memory.`'drain'` will be emitted when the buffer is again free.

The optional `callback` parameter will be executed when the data is finally
written out, which may not be immediately.

See `Writable` stream `write()` method for more
information.

#### Parameters

| Name | Type |
| :------ | :------ |
| `buffer` | `string` \| `Uint8Array` |
| `cb?` | (`err?`: `Error`) => `void` |

#### Returns

`boolean`

**`Since`**

v0.1.90

#### Inherited from

tty.ReadStream.write

#### Defined in

node_modules/@types/node/net.d.ts:115

▸ **write**(`str`, `encoding?`, `cb?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `str` | `string` \| `Uint8Array` |
| `encoding?` | [`BufferEncoding`](../modules/config_environment.NodeJS.md#bufferencoding) |
| `cb?` | (`err?`: `Error`) => `void` |

#### Returns

`boolean`

#### Inherited from

tty.ReadStream.write

#### Defined in

node_modules/@types/node/net.d.ts:116
