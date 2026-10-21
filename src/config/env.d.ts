declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Override default output format options for all outputs.
     * JSON string compatible with `OutputFormatsOptions` type.
     *
     * **note:** works only before `ImageResizeConfig` is initialized.
     *
     * **example:** \
     * `'{"jpg":{"quality":80,"progressive":true,"chromaSubsampling":"4:4:4"},"png":{"quality":100,"colors":128}}'`
     */
    IMAGE_RESIZE_OUTPUT_FORMATS_OPTIONS?: string;

    /**
     * Override default resize strategy hint.
     *
     * **note:** works only before `ImageResizeConfig` is initialized.
     *
     * **options:**
     * - `'upsample'` - source is considered x1;
     * - `'downsample'` - lowest resolution is x1 or source is highest
     * multiplier;
     * - what source multiplier is - `'x1'`, `'x2'`, `'x3.5'`; // SizeMultiplier
     * - what x1 is - `{"width":1024,"height":768}`. // object containing
     * width and height
     */
    IMAGE_RESIZE_RESIZE_STRATEGY_HINT?: string;

    /**
     * Override default abort strategy. Dictates what happens in case of
     * an error.
     *
     * **note:** works only before `ImageResizeConfig` is initialized.
     *
     * **options:**
     * - `'abort-all'` - abort all sources and quit with fail ASAP.
     * - `'abort-current-source'` - abort only the current processing source for
     * the given batch. Continue the the execution.
     * - `'abort-current-size'` - abort only the current processing size for
     * the given source. Continue the the execution.
     * - `'abort-current-format'` - abort only the current output format for the
     * given size. Continue the the execution.
     */
    IMAGE_RESIZE_ABORT_SCOPE?: string;

    /**
     * Override default suffix for all file outputs.
     *
     * **note:** works only before `ImageResizeConfig` is initialized.
     *
     * - *wildcards:*\
     * `'{w}'` - width in pixels;\
     * `'{h}'` - height in pixels;\
     * `'{sm}'` - size multiplier based on area;\
     * `'{wm}'` - width multiplier;\
     * `'{hm}'` - height multiplier.
     * - *example:*\
     * `_@x{sm}_{w}w` - can produce `'_@x2_2048w'`.
     */
    IMAGE_RESIZE_SUFFIX?: string;

    /** Override default log level.
     *
     * **note:** works only before `ImageResizeConfig` is initialized.
     *
     * **options:**
     * - `'silent'` - suppress all logs;
     * - `'fatal'` - display only fatal errors;
     * - `'error'` - display errors and above;
     * - `'warning'` - display warning and above;
     * - `'info'` - display info and above;
     * - `'debug'` - display debug and above;
     * - `'verbose'` - display verbose and above.
     * */
    IMAGE_RESIZE_LOG_LEVEL?: string;
  }
}
