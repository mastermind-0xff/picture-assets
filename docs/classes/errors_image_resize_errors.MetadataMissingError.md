[react-basic-elements](../README.md) / [Exports](../modules.md) / [errors/image-resize-errors](../modules/errors_image_resize_errors.md) / MetadataMissingError

# Class: MetadataMissingError

[errors/image-resize-errors](../modules/errors_image_resize_errors.md).MetadataMissingError

## Hierarchy

- `Error`

  ↳ **`MetadataMissingError`**

## Table of contents

### Constructors

- [constructor](errors_image_resize_errors.MetadataMissingError.md#constructor)

### Properties

- [cause](errors_image_resize_errors.MetadataMissingError.md#cause)
- [message](errors_image_resize_errors.MetadataMissingError.md#message)
- [name](errors_image_resize_errors.MetadataMissingError.md#name)
- [stack](errors_image_resize_errors.MetadataMissingError.md#stack)
- [prepareStackTrace](errors_image_resize_errors.MetadataMissingError.md#preparestacktrace)
- [stackTraceLimit](errors_image_resize_errors.MetadataMissingError.md#stacktracelimit)

### Methods

- [captureStackTrace](errors_image_resize_errors.MetadataMissingError.md#capturestacktrace)

## Constructors

### constructor

• **new MetadataMissingError**(`message?`): [`MetadataMissingError`](errors_image_resize_errors.MetadataMissingError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`MetadataMissingError`](errors_image_resize_errors.MetadataMissingError.md)

#### Inherited from

Error.constructor

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1081

• **new MetadataMissingError**(`message?`, `options?`): [`MetadataMissingError`](errors_image_resize_errors.MetadataMissingError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

[`MetadataMissingError`](errors_image_resize_errors.MetadataMissingError.md)

#### Inherited from

Error.constructor

#### Defined in

node_modules/typescript/lib/lib.es2022.error.d.ts:28

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

#### Defined in

node_modules/typescript/lib/lib.es2022.error.d.ts:24

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1076

___

### name

• **name**: `string` = `'MetadataMissingError'`

#### Overrides

Error.name

#### Defined in

src/errors/image-resize-errors.ts:5

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1077

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: [`CallSite`](../interfaces/config_environment.NodeJS.CallSite.md)[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | [`CallSite`](../interfaces/config_environment.NodeJS.CallSite.md)[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:21
