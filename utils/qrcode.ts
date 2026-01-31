/*
https://github.com/rx-ts/vue/blob/master/packages/vue-qrcode/index.ts
MIT License

Copyright (c) 2017-present JounQin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import type {
  QRCodeErrorCorrectionLevel,
  QRCodeMaskPattern,
  QRCodeSegment,
  QRCodeToDataURLOptions,
  QRCodeToDataURLOptionsJpegWebp,
  QRCodeToSJISFunc,
} from "qrcode";
import QRCode from "qrcode";
import { type PropType, defineComponent, h, ref, watch } from "vue";

export const LEVELS = [
  "low",
  "medium",
  "quartile",
  "high",
  "L",
  "M",
  "Q",
  "H",
] as const;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const MASK_PATTERNS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export const MODES = ["alphanumeric", "numeric", "kanji", "byte"] as const;

export type { QRCodeSegment } from "qrcode";

export type QRCodeValue = QRCodeSegment[] | string

export const TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type QRCodeProps = Omit<QRCodeToDataURLOptions, "renderOptions"> &
  QRCodeToDataURLOptionsJpegWebp["rendererOpts"] & {
  value: QRCodeValue
}

const MAX_QR_VERSION = 40;

export default defineComponent({
  props: {
    version: {
      type: Number,
      validator: (version: number) =>
        version === Number.parseInt(String(version), 10) &&
        version >= 1 &&
        version <= MAX_QR_VERSION,
    },
    errorCorrectionLevel: {
      type: String as PropType<QRCodeErrorCorrectionLevel>,
      validator: (level: QRCodeErrorCorrectionLevel) => LEVELS.includes(level),
    },
    maskPattern: {
      type: Number as PropType<QRCodeMaskPattern>,
      validator: (maskPattern: QRCodeMaskPattern) =>
        MASK_PATTERNS.includes(maskPattern),
    },
    mode: {
      type: String as PropType<"auto" | "numeric" | "alphanumeric" | "byte" | "kanji">,
      default: "auto",
    },
    toSJISFunc: Function as PropType<QRCodeToSJISFunc>,
    margin: Number,
    scale: Number,
    width: Number,
    color: {
      type: Object,
      validator: (color: QRCodeProps["color"]) =>
        (["dark", "light"] as const).every(c =>
          ["string", "undefined"].includes(typeof color![c]),
        ),
      required: true,
    },
    type: {
      type: String as PropType<QRCodeProps["type"]>,
      validator: (type: string) => TYPES.includes(type as (typeof TYPES)[number]),
      required: true,
    },
    quality: {
      type: Number,
      validator: (quality: number) =>
        quality === Number.parseFloat(String(quality)) &&
        quality >= 0 &&
        quality <= 1,
      required: false,
    },
    value: {
      type: [String, Array] as PropType<QRCodeValue>,
      required: true,
      validator(value: QRCodeValue) {
        if (typeof value === "string") {
          return true;
        }
        return value.every(
          it =>
            typeof it.data === "string" &&
            "mode" in it &&
            it.mode &&
            MODES.includes(it.mode),
        );
      },
    },
  },
  setup(props, { attrs, emit }) {
    const dataUrlRef = ref<string>();

    const getValueWithMode = (): QRCodeValue | string => {
      const { value, mode } = props;
      if (mode === "auto" || typeof value !== "string") {
        return value;
      }
      return [{ data: value, mode }];
    };

    const toDataURL = () => {
      const { quality, mode: _mode, value, ...rest } = props;
      const finalValue = getValueWithMode();
      QRCode.toDataURL(
        finalValue,
        Object.assign(rest, quality == null || { renderOptions: { quality } }),
      )
        .then((dataUrl: string) => {
          dataUrlRef.value = dataUrl;
          emit("change", dataUrl);
        })
        .catch((err: unknown) => emit("error", err));
    };

    watch(props, toDataURL, { immediate: true, deep: true });

    return () =>
      h("img", {
        ...attrs,
        src: dataUrlRef.value,
      });
  },
});
