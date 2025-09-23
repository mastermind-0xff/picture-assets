[react-basic-elements](../README.md) / [Exports](../modules.md) / [errors/image-resize-errors](../modules/errors_image_resize_errors.md) / DimensionMissingError

# Class: DimensionMissingError

[errors/image-resize-errors](../modules/errors_image_resize_errors.md).DimensionMissingError

## Hierarchy

- `Error`

  ↳ **`DimensionMissingError`**

## Table of contents

### Constructors

- [constructor](errors_image_resize_errors.DimensionMissingError.md#constructor)

### Properties

- [cause](errors_image_resize_errors.DimensionMissingError.md#cause)
- [message](errors_image_resize_errors.DimensionMissingError.md#message)
- [name](errors_image_resize_errors.DimensionMissingError.md#name)
- [stack](errors_image_resize_errors.DimensionMissingError.md#stack)
- [prepareStackTrace](errors_image_resize_errors.DimensionMissingError.md#preparestacktrace)
- [stackTraceLimit](errors_image_resize_errors.DimensionMissingError.md#stacktracelimit)

### Methods

- [captureStackTrace](errors_image_resize_errors.DimensionMissingError.md#capturestacktrace)

## Constructors

### constructor

• **new DimensionMissingError**(`message?`): [`DimensionMissingError`](errors_image_resize_errors.DimensionMissingError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`DimensionMissingError`](errors_image_resize_errors.DimensionMissingError.md)

#### Inherited from

Error.constructor

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1081

• **new DimensionMissingError**(`message?`, `options?`): [`DimensionMissingError`](errors_image_resize_errors.DimensionMissingError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |
| `options?` | `ErrorOptions` |

#### Returns

[`DimensionMissingError`](errors_image_resize_errors.DimensionMissingError.md)

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

• **name**: `string` = `'DimensionMissingError'`

#### Overrides

Error.name

#### Defined in

src/errors/image-resize-errors.ts:2

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
