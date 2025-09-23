[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / ProcessReport

# Interface: ProcessReport

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).ProcessReport

## Table of contents

### Properties

- [directory](config_environment.NodeJS.ProcessReport.md#directory)
- [filename](config_environment.NodeJS.ProcessReport.md#filename)
- [reportOnFatalError](config_environment.NodeJS.ProcessReport.md#reportonfatalerror)
- [reportOnSignal](config_environment.NodeJS.ProcessReport.md#reportonsignal)
- [reportOnUncaughtException](config_environment.NodeJS.ProcessReport.md#reportonuncaughtexception)
- [signal](config_environment.NodeJS.ProcessReport.md#signal)

### Methods

- [getReport](config_environment.NodeJS.ProcessReport.md#getreport)
- [writeReport](config_environment.NodeJS.ProcessReport.md#writereport)

## Properties

### directory

• **directory**: `string`

Directory where the report is written.
working directory of the Node.js process.

**`Default`**

```ts
'' indicating that reports are written to the current
```

#### Defined in

node_modules/@types/node/process.d.ts:154

___

### filename

• **filename**: `string`

Filename where the report is written.
The default value is the empty string.

**`Default`**

```ts
'' the output filename will be comprised of a timestamp,
PID, and sequence number.
```

#### Defined in

node_modules/@types/node/process.d.ts:161

___

### reportOnFatalError

• **reportOnFatalError**: `boolean`

If true, a diagnostic report is generated on fatal errors,
such as out of memory errors or failed C++ assertions.

**`Default`**

```ts
false
```

#### Defined in

node_modules/@types/node/process.d.ts:172

___

### reportOnSignal

• **reportOnSignal**: `boolean`

If true, a diagnostic report is generated when the process
receives the signal specified by process.report.signal.

**`Default`**

```ts
false
```

#### Defined in

node_modules/@types/node/process.d.ts:178

___

### reportOnUncaughtException

• **reportOnUncaughtException**: `boolean`

If true, a diagnostic report is generated on uncaught exception.

**`Default`**

```ts
false
```

#### Defined in

node_modules/@types/node/process.d.ts:183

___

### signal

• **signal**: [`Signals`](../modules/config_environment.NodeJS.md#signals)

The signal used to trigger the creation of a diagnostic report.

**`Default`**

```ts
'SIGUSR2'
```

#### Defined in

node_modules/@types/node/process.d.ts:188

## Methods

### getReport

▸ **getReport**(`err?`): `string`

Returns a JSON-formatted diagnostic report for the running process.
The report's JavaScript stack trace is taken from err, if present.

#### Parameters

| Name | Type |
| :------ | :------ |
| `err?` | `Error` |

#### Returns

`string`

#### Defined in

node_modules/@types/node/process.d.ts:166

___

### writeReport

▸ **writeReport**(`fileName?`): `string`

Writes a diagnostic report to a file. If filename is not provided, the default filename
includes the date, time, PID, and a sequence number.
The report's JavaScript stack trace is taken from err, if present.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fileName?` | `string` | Name of the file where the report is written. This should be a relative path, that will be appended to the directory specified in `process.report.directory`, or the current working directory of the Node.js process, if unspecified. |

#### Returns

`string`

Filename of the generated report.

#### Defined in

node_modules/@types/node/process.d.ts:201

▸ **writeReport**(`error?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error?` | `Error` |

#### Returns

`string`

#### Defined in

node_modules/@types/node/process.d.ts:202

▸ **writeReport**(`fileName?`, `err?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fileName?` | `string` |
| `err?` | `Error` |

#### Returns

`string`

#### Defined in

node_modules/@types/node/process.d.ts:203
