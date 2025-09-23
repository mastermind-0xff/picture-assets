[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / Module

# Interface: Module

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).Module

## Table of contents

### Properties

- [children](config_environment.NodeJS.Module.md#children)
- [exports](config_environment.NodeJS.Module.md#exports)
- [filename](config_environment.NodeJS.Module.md#filename)
- [id](config_environment.NodeJS.Module.md#id)
- [isPreloading](config_environment.NodeJS.Module.md#ispreloading)
- [loaded](config_environment.NodeJS.Module.md#loaded)
- [parent](config_environment.NodeJS.Module.md#parent)
- [path](config_environment.NodeJS.Module.md#path)
- [paths](config_environment.NodeJS.Module.md#paths)
- [require](config_environment.NodeJS.Module.md#require)

## Properties

### children

• **children**: [`Module`](config_environment.NodeJS.Module.md)[]

#### Defined in

node_modules/@types/node/globals.d.ts:349

___

### exports

• **exports**: `any`

#### Defined in

node_modules/@types/node/globals.d.ts:342

___

### filename

• **filename**: `string`

#### Defined in

node_modules/@types/node/globals.d.ts:345

___

### id

• **id**: `string`

#### Defined in

node_modules/@types/node/globals.d.ts:344

___

### isPreloading

• **isPreloading**: `boolean`

`true` if the module is running during the Node.js preload

#### Defined in

node_modules/@types/node/globals.d.ts:341

___

### loaded

• **loaded**: `boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:346

___

### parent

• **parent**: `undefined` \| ``null`` \| [`Module`](config_environment.NodeJS.Module.md)

**`Deprecated`**

since v14.6.0 Please use `require.main` and `module.children` instead.

#### Defined in

node_modules/@types/node/globals.d.ts:348

___

### path

• **path**: `string`

**`Since`**

v11.14.0

The directory name of the module. This is usually the same as the path.dirname() of the module.id.

#### Defined in

node_modules/@types/node/globals.d.ts:355

___

### paths

• **paths**: `string`[]

#### Defined in

node_modules/@types/node/globals.d.ts:356

___

### require

• **require**: [`Require`](config_environment.NodeJS.Require.md)

#### Defined in

node_modules/@types/node/globals.d.ts:343
