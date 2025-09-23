[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / EmitWarningOptions

# Interface: EmitWarningOptions

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).EmitWarningOptions

## Table of contents

### Properties

- [code](config_environment.NodeJS.EmitWarningOptions.md#code)
- [ctor](config_environment.NodeJS.EmitWarningOptions.md#ctor)
- [detail](config_environment.NodeJS.EmitWarningOptions.md#detail)
- [type](config_environment.NodeJS.EmitWarningOptions.md#type)

## Properties

### code

• `Optional` **code**: `string`

A unique identifier for the warning instance being emitted.

#### Defined in

node_modules/@types/node/process.d.ts:233

___

### ctor

• `Optional` **ctor**: `Function`

When `warning` is a `string`, `ctor` is an optional function used to limit the generated stack trace.

**`Default`**

```ts
process.emitWarning
```

#### Defined in

node_modules/@types/node/process.d.ts:239

___

### detail

• `Optional` **detail**: `string`

Additional text to include with the error.

#### Defined in

node_modules/@types/node/process.d.ts:243

___

### type

• `Optional` **type**: `string`

When `warning` is a `string`, `type` is the name to use for the _type_ of warning being emitted.

**`Default`**

```ts
'Warning'
```

#### Defined in

node_modules/@types/node/process.d.ts:229
