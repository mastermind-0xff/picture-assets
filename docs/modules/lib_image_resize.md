[react-basic-elements](../README.md) / [Exports](../modules.md) / lib/image-resize

# Module: lib/image-resize

## Table of contents

### Type Aliases

- [GeneratedAssets](lib_image_resize.md#generatedassets)
- [OutputFormats](lib_image_resize.md#outputformats)
- [OutputFormatsOptions](lib_image_resize.md#outputformatsoptions)
- [OutputSizesAndSuffixes](lib_image_resize.md#outputsizesandsuffixes)
- [ResizeResolution](lib_image_resize.md#resizeresolution)
- [SizeMultiplier](lib_image_resize.md#sizemultiplier)

### Functions

- [calcWidthAndHeightMultiplier](lib_image_resize.md#calcwidthandheightmultiplier)
- [findMaxMultiplier](lib_image_resize.md#findmaxmultiplier)
- [imageResizeAsync](lib_image_resize.md#imageresizeasync)
- [isOutputFormatOptionsKey](lib_image_resize.md#isoutputformatoptionskey)
- [isSharpFormatEnum](lib_image_resize.md#issharpformatenum)
- [parseSuffix](lib_image_resize.md#parsesuffix)

## Type Aliases

### GeneratedAssets

Ƭ **GeneratedAssets**: `Object`

Object containing source image path and list of output images' paths.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `in` | `string` | Source path |
| `out` | `string`[] | List of output paths |

#### Defined in

src/lib/image-resize.ts:46

___

### OutputFormats

Ƭ **OutputFormats**: keyof `FormatEnum`

List of allowed output file types.

#### Defined in

src/lib/image-resize.ts:24

___

### OutputFormatsOptions

Ƭ **OutputFormatsOptions**: `Object`

List of available output file type options.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `avif?` | `AvifOptions` |
| `gif?` | `GifOptions` |
| `heif?` | `HeifOptions` |
| `jp2?` | `Jp2Options` |
| `jpeg?` | `JpegOptions` |
| `jpg?` | `JpegOptions` |
| `jxl?` | `JxlOptions` |
| `png?` | `PngOptions` |
| `tif?` | `TiffOptions` |
| `tiff?` | `TiffOptions` |
| `webp?` | `WebpOptions` |

#### Defined in

src/lib/image-resize.ts:29

___

### OutputSizesAndSuffixes

Ƭ **OutputSizesAndSuffixes**: \{ `height`: [`ResizeResolution`](lib_image_resize.md#resizeresolution) ; `options?`: `ResizeOptions` ; `suffix?`: `string` ; `width?`: [`ResizeResolution`](lib_image_resize.md#resizeresolution)  } \| \{ `height?`: [`ResizeResolution`](lib_image_resize.md#resizeresolution) ; `options?`: `ResizeOptions` ; `suffix?`: `string` ; `width`: [`ResizeResolution`](lib_image_resize.md#resizeresolution)  }

Output sizes options and size file name suffix. Width or height required.

#### Defined in

src/lib/image-resize.ts:68

___

### ResizeResolution

Ƭ **ResizeResolution**: `number` \| [`SizeMultiplier`](lib_image_resize.md#sizemultiplier)

Fixed pixels or size multiplier based on source size and resize config.

#### Defined in

src/lib/image-resize.ts:63

___

### SizeMultiplier

Ƭ **SizeMultiplier**: ``"x1"`` \| ``"x2"`` \| ``"x3"`` \| ``"x4"`` \| ``"x5"``

Image resolution multiplier for width and/or height. Behavior based on
source's resolution and
**ImageResizeOptions.SIZE_MULTIPLIER_BEHAVIOR**

#### Defined in

src/lib/image-resize.ts:60

## Functions

### calcWidthAndHeightMultiplier

▸ **calcWidthAndHeightMultiplier**(`srcWidth`, `srcHeight`, `maxMultiplier`, `requiredWidth?`, `requiredHeight?`, `multiplayerBehavior?`): `Object`

Calculate new width or height or both based on provided multipliers and
config.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `srcWidth` | `number` | `undefined` | Source image width in pixels. |
| `srcHeight` | `number` | `undefined` | Source image height in pixels. |
| `maxMultiplier` | `number` | `undefined` | - |
| `requiredWidth?` | [`ResizeResolution`](lib_image_resize.md#resizeresolution) | `undefined` | Width or multiplier for the current calculation. |
| `requiredHeight?` | [`ResizeResolution`](lib_image_resize.md#resizeresolution) | `undefined` | Height or multiplier for the current calculation. |
| `multiplayerBehavior` | [`SizeMultiplierBehavior`](config_main.md#sizemultiplierbehavior) | `ImageResizeConfig.SIZE_MULTIPLIER_BEHAVIOR` | - |

#### Returns

`Object`

Object containing new width and height. One dimension can be
undefined so sharp can do more precise calculation on the other.

| Name | Type |
| :------ | :------ |
| `height` | `undefined` \| `number` |
| `width` | `undefined` \| `number` |

#### Defined in

src/lib/image-resize.ts:144

___

### findMaxMultiplier

▸ **findMaxMultiplier**(`sizesAndSuffixes`): `number`

Get the maximum multiplier from width and height properties if supplied.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `sizesAndSuffixes` | [`OutputSizesAndSuffixes`](lib_image_resize.md#outputsizesandsuffixes)[] | All sizes and suffixes |

#### Returns

`number`

The maximum multiplier or 0.

#### Defined in

src/lib/image-resize.ts:119

___

### imageResizeAsync

▸ **imageResizeAsync**(`srcPath`, `destPath`, `sizesAndSuffixes`, `formats?`, `formatsOptions?`): `Promise`\<[`GeneratedAssets`](lib_image_resize.md#generatedassets)\>

Convert a single image source file to a multiple output formats and
resolutions.

**examples:**
```typescript
const result = await  imageResizeAsync(
 '/path/to/file.jpg',
 '/path/to/assets/new-name',
 [
  { width: 2048, suffix: '@2x({w}w)' },
  { width: 1024, suffix: '@1x({w}w)' },
 ],
 ['webp', 'jpg']
);
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `srcPath` | `string` | `undefined` | Path to a single source file. |
| `destPath` | `string` | `undefined` | Path to a output file or directory. If extension is present it will be added to the output formats list. If trailing dash is used (destination is a directory) source name will be used as destination file name otherwise the string after the last dash will be used as prefix for all sizes and formats. |
| `sizesAndSuffixes` | [`OutputSizesAndSuffixes`](lib_image_resize.md#outputsizesandsuffixes)[] | `undefined` | List of objects containing width and/or height, additional "options" param and file name suffix string. Omit width or height to calculate them automatically. Suffix can use '{w}' or '{h}' wildcards for output file width and height respectively. |
| `formats?` | keyof `FormatEnum`[] | `undefined` | List of strings containing output file formats. |
| `formatsOptions` | [`OutputFormatsOptions`](lib_image_resize.md#outputformatsoptions) | `ImageResizeConfig.OUTPUT_FORMATS_OPTIONS_DEFAULT` | Additional options for each provided file format. |

#### Returns

`Promise`\<[`GeneratedAssets`](lib_image_resize.md#generatedassets)\>

Resolves to an object containing source file and generated images
list.

#### Defined in

src/lib/image-resize.ts:366

___

### isOutputFormatOptionsKey

▸ **isOutputFormatOptionsKey**(`key`): key is keyof OutputFormatsOptions

Output format options type guard.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | File name extension string. |

#### Returns

key is keyof OutputFormatsOptions

Boolean.

#### Defined in

src/lib/image-resize.ts:106

___

### isSharpFormatEnum

▸ **isSharpFormatEnum**(`key`): key is keyof FormatEnum

Sharp Format type guard.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | File name extension string. |

#### Returns

key is keyof FormatEnum

Boolean.

#### Defined in

src/lib/image-resize.ts:94

___

### parseSuffix

▸ **parseSuffix**(`suffix`, `width`, `height`): `string`

Check for user supplied suffix or use the one provided in config object and
replace wildcards if any.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `suffix` | `undefined` \| `string` | String to be attached to every file. |
| `width` | `number` | Width in pixels to replace {w} wildcard. |
| `height` | `number` | Height in pixels to replace {h} wildcard |

#### Returns

`string`

The new suffix.

#### Defined in

src/lib/image-resize.ts:220
