[react-basic-elements](../README.md) / [Exports](../modules.md) / lib/image-resize-batch

# Module: lib/image-resize-batch

## Table of contents

### Functions

- [batchImageResizeAsync](lib_image_resize_batch.md#batchimageresizeasync)

## Functions

### batchImageResizeAsync

▸ **batchImageResizeAsync**(`srcPath`, `destRoot`, `sizes`, `formats?`, `formatsOutputOptions?`, `numAsyncSpawns?`): `Promise`\<`void`\>

Convert multiple files to a multiple output formats and resolutions.
Glob selection allowed.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `srcPath` | `string` \| \{ `resource`: `string` ; `root`: `string`  } | `undefined` | String to source file or object containing 'root' dir (to be matched against destination dir and used as prefix for the output) and 'resource' to target a specific file in that root. |
| `destRoot` | `string` | `undefined` | Directory to output all converted files. |
| `sizes` | [`OutputSizesAndSuffixes`](lib_image_resize.md#outputsizesandsuffixes)[] | `undefined` | Object containing width and/or height and additional "options" params. Omit width or height to calc them automatically. |
| `formats?` | keyof `FormatEnum`[] | `undefined` | Array containing output format strings. |
| `formatsOutputOptions?` | [`OutputFormatsOptions`](lib_image_resize.md#outputformatsoptions) | `undefined` | Additional options for each provided format. |
| `numAsyncSpawns` | `number` | `3` | How many processes to run at the same time while there are files to be generated. Multi-core CPUs might benefit from this factor. |

#### Returns

`Promise`\<`void`\>

#### Defined in

src/lib/image-resize-batch.ts:25
