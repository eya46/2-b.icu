declare module "qrcode" {
  export type QRCodeErrorCorrectionLevel = "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";
  export type QRCodeMaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  export type QRCodeMode = "alphanumeric" | "numeric" | "kanji" | "byte";

  export interface QRCodeSegment {
    data: string;
    mode: QRCodeMode;
  }

  export interface QRCodeToDataURLOptions {
    version?: number;
    errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
    maskPattern?: QRCodeMaskPattern;
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    type?: string;
    rendererOpts?: {
      quality?: number;
    };
    renderOptions?: {
      quality?: number;
    };
  }

  export interface QRCodeToSJISFunc {
    (code: number): number;
  }

  export interface QRCodeToDataURLOptionsJpegWebp {
    rendererOpts: {
      quality?: number;
    };
  }

  export function toDataURL(
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<void>;

  export function toString(
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<string>;
}
