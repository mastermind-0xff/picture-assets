[react-basic-elements](../README.md) / [Exports](../modules.md) / config/main

# Module: config/main

## Table of contents

### Type Aliases

- [ImageResizeOptions](config_main.md#imageresizeoptions)
- [SizeMultiplierBehavior](config_main.md#sizemultiplierbehavior)

### Variables

- [ImageResizeConfig](config_main.md#imageresizeconfig)

## Type Aliases

### ImageResizeOptions

Ƭ **ImageResizeOptions**: `Object`

Configuration object type.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `DEBUG` | `boolean` | Enable or disable console messages. Provide truthful value to enable. |
| `OUTPUT_FORMATS_OPTIONS_DEFAULT` | [`OutputFormatsOptions`](lib_image_resize.md#outputformatsoptions) | Default options for each filetype. Also used to provide keys for type guard check. |
| `SIZE_MULTIPLIER_BEHAVIOR` | [`SizeMultiplierBehavior`](config_main.md#sizemultiplierbehavior) | When using size multiplier for output image width or height **downsample** means the source is considered the highest resolution image and all other sizes are downsampled. With **upscale** source is considered the lowest resolution image and all other sizes are scaled up. When source multiplier is hardcoded all other sizes are calculated accordingly. **examples** ```typescript // source @ 300x300px console.log(imageResizeAsync( 'image.jpg', './dest/', [ { width: 'x3', suffix: '@3x({w}w)' }, { width: 'x2', suffix: '@2x({w}w)' }, { width: 'x1', suffix: '@1x({w}w)' }, ], ['webp'])) // downsample will output // {in:'image.jpg', // out:[ // './dest/image@3x(300w).webp', // './dest/image@2x(200w).webp', // './dest/image@1x(100w).webp' // ]} // upscale will output // {in:'image.jpg', // out:[ // './dest/image@3x(900w).webp', // './dest/image@2x(600w).webp', // './dest/image@1x(300w).webp' // ]} // x2 will output // {in:'image.jpg', // out:[ // './dest/image@3x(450w).webp', // './dest/image@2x(300w).webp', // './dest/image@1x(150w).webp' // ]} ``` |
| `SUFFIX_DEFAULT` | `string` | Default suffix for all outputted file names. Use '{w}' for output width and '{h}' for output height. Strips slashes. Accounts for '0' and empty input. Defaults to '@{w}w'. |

#### Defined in

src/config/main.ts:11

___

### SizeMultiplierBehavior

Ƭ **SizeMultiplierBehavior**: ``"downsample"`` \| ``"upscale"`` \| [`SizeMultiplier`](lib_image_resize.md#sizemultiplier)

Multiplier behavior allowed values.

#### Defined in

src/config/main.ts:6

## Variables

### ImageResizeConfig

• `Const` **ImageResizeConfig**: [`ImageResizeOptions`](config_main.md#imageresizeoptions)

Configuration object.

#### Defined in

src/config/main.ts:77
