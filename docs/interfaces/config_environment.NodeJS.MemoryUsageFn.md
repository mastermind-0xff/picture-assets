[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / MemoryUsageFn

# Interface: MemoryUsageFn

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).MemoryUsageFn

## Callable

### MemoryUsageFn

▸ **MemoryUsageFn**(): [`MemoryUsage`](config_environment.NodeJS.MemoryUsage.md)

The `process.memoryUsage()` method iterate over each page to gather informations about memory
usage which can be slow depending on the program memory allocations.

#### Returns

[`MemoryUsage`](config_environment.NodeJS.MemoryUsage.md)

#### Defined in

node_modules/@types/node/process.d.ts:17

## Table of contents

### Methods

- [rss](config_environment.NodeJS.MemoryUsageFn.md#rss)

## Methods

### rss

▸ **rss**(): `number`

method returns an integer representing the Resident Set Size (RSS) in bytes.

#### Returns

`number`

#### Defined in

node_modules/@types/node/process.d.ts:21
