[react-basic-elements](../README.md) / [Exports](../modules.md) / [config/environment](../modules/config_environment.md) / [NodeJS](../modules/config_environment.NodeJS.md) / CallSite

# Interface: CallSite

[config/environment](../modules/config_environment.md).[NodeJS](../modules/config_environment.NodeJS.md).CallSite

## Table of contents

### Methods

- [getColumnNumber](config_environment.NodeJS.CallSite.md#getcolumnnumber)
- [getEnclosingColumnNumber](config_environment.NodeJS.CallSite.md#getenclosingcolumnnumber)
- [getEnclosingLineNumber](config_environment.NodeJS.CallSite.md#getenclosinglinenumber)
- [getEvalOrigin](config_environment.NodeJS.CallSite.md#getevalorigin)
- [getFileName](config_environment.NodeJS.CallSite.md#getfilename)
- [getFunction](config_environment.NodeJS.CallSite.md#getfunction)
- [getFunctionName](config_environment.NodeJS.CallSite.md#getfunctionname)
- [getLineNumber](config_environment.NodeJS.CallSite.md#getlinenumber)
- [getMethodName](config_environment.NodeJS.CallSite.md#getmethodname)
- [getPosition](config_environment.NodeJS.CallSite.md#getposition)
- [getPromiseIndex](config_environment.NodeJS.CallSite.md#getpromiseindex)
- [getScriptHash](config_environment.NodeJS.CallSite.md#getscripthash)
- [getScriptNameOrSourceURL](config_environment.NodeJS.CallSite.md#getscriptnameorsourceurl)
- [getThis](config_environment.NodeJS.CallSite.md#getthis)
- [getTypeName](config_environment.NodeJS.CallSite.md#gettypename)
- [isAsync](config_environment.NodeJS.CallSite.md#isasync)
- [isConstructor](config_environment.NodeJS.CallSite.md#isconstructor)
- [isEval](config_environment.NodeJS.CallSite.md#iseval)
- [isNative](config_environment.NodeJS.CallSite.md#isnative)
- [isPromiseAll](config_environment.NodeJS.CallSite.md#ispromiseall)
- [isToplevel](config_environment.NodeJS.CallSite.md#istoplevel)
- [toString](config_environment.NodeJS.CallSite.md#tostring)

## Methods

### getColumnNumber

▸ **getColumnNumber**(): ``null`` \| `number`

Current column number [if this function was defined in a script]

#### Returns

``null`` \| `number`

#### Defined in

node_modules/@types/node/globals.d.ts:210

___

### getEnclosingColumnNumber

▸ **getEnclosingColumnNumber**(): `number`

#### Returns

`number`

#### Defined in

node_modules/@types/node/globals.d.ts:258

___

### getEnclosingLineNumber

▸ **getEnclosingLineNumber**(): `number`

#### Returns

`number`

#### Defined in

node_modules/@types/node/globals.d.ts:259

___

### getEvalOrigin

▸ **getEvalOrigin**(): `undefined` \| `string`

A call site object representing the location where eval was called
[if this function was created using a call to eval]

#### Returns

`undefined` \| `string`

#### Defined in

node_modules/@types/node/globals.d.ts:216

___

### getFileName

▸ **getFileName**(): `undefined` \| `string`

Name of the script [if this function was defined in a script]

#### Returns

`undefined` \| `string`

#### Defined in

node_modules/@types/node/globals.d.ts:200

___

### getFunction

▸ **getFunction**(): `undefined` \| `Function`

Current function

#### Returns

`undefined` \| `Function`

#### Defined in

node_modules/@types/node/globals.d.ts:182

___

### getFunctionName

▸ **getFunctionName**(): ``null`` \| `string`

Name of the current function, typically its name property.
If a name property is not available an attempt will be made to try
to infer a name from the function's context.

#### Returns

``null`` \| `string`

#### Defined in

node_modules/@types/node/globals.d.ts:189

___

### getLineNumber

▸ **getLineNumber**(): ``null`` \| `number`

Current line number [if this function was defined in a script]

#### Returns

``null`` \| `number`

#### Defined in

node_modules/@types/node/globals.d.ts:205

___

### getMethodName

▸ **getMethodName**(): ``null`` \| `string`

Name of the property [of "this" or one of its prototypes] that holds
the current function

#### Returns

``null`` \| `string`

#### Defined in

node_modules/@types/node/globals.d.ts:195

___

### getPosition

▸ **getPosition**(): `number`

#### Returns

`number`

#### Defined in

node_modules/@types/node/globals.d.ts:260

___

### getPromiseIndex

▸ **getPromiseIndex**(): ``null`` \| `number`

returns the index of the promise element that was followed in
Promise.all() or Promise.any() for async stack traces, or null
if the CallSite is not an async

#### Returns

``null`` \| `number`

#### Defined in

node_modules/@types/node/globals.d.ts:253

___

### getScriptHash

▸ **getScriptHash**(): `string`

#### Returns

`string`

#### Defined in

node_modules/@types/node/globals.d.ts:256

___

### getScriptNameOrSourceURL

▸ **getScriptNameOrSourceURL**(): `string`

#### Returns

`string`

#### Defined in

node_modules/@types/node/globals.d.ts:255

___

### getThis

▸ **getThis**(): `unknown`

Value of "this"

#### Returns

`unknown`

#### Defined in

node_modules/@types/node/globals.d.ts:169

___

### getTypeName

▸ **getTypeName**(): ``null`` \| `string`

Type of "this" as a string.
This is the name of the function stored in the constructor field of
"this", if available.  Otherwise the object's [[Class]] internal
property.

#### Returns

``null`` \| `string`

#### Defined in

node_modules/@types/node/globals.d.ts:177

___

### isAsync

▸ **isAsync**(): `boolean`

is this an async call (i.e. await, Promise.all(), or Promise.any())?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:241

___

### isConstructor

▸ **isConstructor**(): `boolean`

Is this a constructor call?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:236

___

### isEval

▸ **isEval**(): `boolean`

Does this call take place in code defined by a call to eval?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:226

___

### isNative

▸ **isNative**(): `boolean`

Is this call in native V8 code?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:231

___

### isPromiseAll

▸ **isPromiseAll**(): `boolean`

is this an async call to Promise.all()?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:246

___

### isToplevel

▸ **isToplevel**(): `boolean`

Is this a toplevel invocation, that is, is "this" the global object?

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/globals.d.ts:221

___

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Defined in

node_modules/@types/node/globals.d.ts:262
