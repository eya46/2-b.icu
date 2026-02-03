<script setup lang="ts">
interface ColorFormats {
  hex: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
}

const colorPicker = ref<string>("#FF5733");
const hexInput = ref("");
const rgbInput = ref("");
const hslInput = ref("");
const convertedFormats = reactive<ColorFormats>({
  hex: "",
  rgb: "",
  rgba: "",
  hsl: "",
  hsla: "",
});

const hexToRgb = (hex: string): { r: number; g: number; b: number; a?: number } | null => {
  hex = hex.trim();
  if (!hex.startsWith("#")) {
    return null;
  }

  const cleanHex = hex.slice(1);
  const len = cleanHex.length;

  if (![3, 4, 6, 8].includes(len)) {
    return null;
  }

  const isShort = len === 3 || len === 4;
  const isAlpha = len === 4 || len === 8;

  let r: number, g: number, b: number;
  let a: number | undefined;

  if (isShort) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isAlpha) {
      a = parseInt(cleanHex[3] + cleanHex[3], 16) / 255;
    }
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
    if (isAlpha) {
      a = parseInt(cleanHex.substring(6, 8), 16) / 255;
    }
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b, a };
};

const rgbToHex = (r: number, g: number, b: number, a?: number): string => {
  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  let hex = "#" + toHex(r) + toHex(g) + toHex(b);
  if (a !== undefined) {
    hex += toHex(a * 255);
  }

  return hex.toUpperCase();
};

const rgbToHsl = (r: number, g: number, b: number, a?: number): { h: number; s: number; l: number; a?: number } => {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;

  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === nr) {
      h = ((ng - nb) / delta) % 6;
    } else if (max === ng) {
      h = (nb - nr) / delta + 2;
    } else {
      h = (nr - ng) / delta + 4;
    }

    h = h * 60;
    if (h < 0) {
      h += 360;
    }
  }

  return { h, s: s * 100, l: l * 100, a };
};

const hslToRgb = (h: number, s: number, l: number, a?: number): { r: number; g: number; b: number; a?: number } => {
  const ns = s / 100;
  const nl = l / 100;

  let r: number, g: number, b: number;

  if (ns === 0) {
    r = g = b = nl;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns;
    const p = 2 * nl - q;
    const nt = h / 360;

    r = hue2rgb(p, q, nt + 1 / 3);
    g = hue2rgb(p, q, nt);
    b = hue2rgb(p, q, nt - 1 / 3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
};

const parseRgbString = (str: string): { r: number; g: number; b: number; a?: number } | null => {
  const match = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (!match) {
    return null;
  }

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b, a };
};

const parseHslString = (str: string): { h: number; s: number; l: number; a?: number } | null => {
  const match = str.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (!match) {
    return null;
  }

  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    return null;
  }

  return { h, s, l, a };
};

const updateFormats = (source: "hex" | "rgb" | "hsl", value: string, showMessage: boolean = true) => {
  let rgb: { r: number; g: number; b: number; a?: number } | null = null;

  if (source === "hex") {
    rgb = hexToRgb(value);
  } else if (source === "rgb") {
    rgb = parseRgbString(value);
  } else if (source === "hsl") {
    const hsl = parseHslString(value);
    if (hsl) {
      rgb = hslToRgb(hsl.h, hsl.s, hsl.l, hsl.a);
    }
  }

  if (!rgb) {
    if (showMessage) {
      ElMessage({
        message: "无效的颜色格式",
        type: "error",
      });
    }
    return;
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b, rgb.a);

  convertedFormats.hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  convertedFormats.rgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  convertedFormats.rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a !== undefined ? rgb.a.toFixed(2) : 1.00})`;
  convertedFormats.hsl = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
  convertedFormats.hsla = `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${hsl.a !== undefined ? hsl.a.toFixed(2) : 1.00})`;

  hexInput.value = convertedFormats.hex;
  rgbInput.value = convertedFormats.rgb;
  hslInput.value = convertedFormats.hsl;

  if (source === "hex") {
    colorPicker.value = convertedFormats.hex;
  } else if (source === "rgb") {
    colorPicker.value = convertedFormats.rgba;
  }

  if (showMessage) {
    ElMessage({
      message: "转换成功",
      type: "success",
    });
  }
};

watch(colorPicker, (newColor) => {
  if (newColor.startsWith("rgb")) {
    updateFormats("rgb", newColor, false);
  } else if (newColor.startsWith("#")) {
    updateFormats("hex", newColor, false);
  }
});

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage({
      message: "已复制到剪贴板",
      type: "success",
    });
  }).catch(() => {
    ElMessage({
      message: "复制失败",
      type: "error",
    });
  });
};

onMounted(() => {
  updateFormats("hex", colorPicker.value);
});
</script>

<template>
  <div class="color-page">
    <div class="picker-section">
      <el-color-picker
        v-model="colorPicker"
        @change="() => updateFormats('hex', colorPicker)"
        size="large"
        show-alpha
      />
      <div class="color-preview" :style="{ backgroundColor: colorPicker }"></div>
      <span class="color-value">{{ colorPicker }}</span>
    </div>

    <div class="convert-section">
      <el-input
        v-model="hexInput"
        placeholder="#RRGGBB"
        @keyup.enter="updateFormats('hex', hexInput)"
      >
        <template #prepend>HEX</template>
        <template #append>
          <el-button @click="updateFormats('hex', hexInput)">转换</el-button>
        </template>
      </el-input>
      <el-input
        v-model="rgbInput"
        placeholder="rgb(r, g, b)"
        @keyup.enter="updateFormats('rgb', rgbInput)"
      >
        <template #prepend>RGB</template>
        <template #append>
          <el-button @click="updateFormats('rgb', rgbInput)">转换</el-button>
        </template>
      </el-input>
      <el-input
        v-model="hslInput"
        placeholder="hsl(h, s%, l%)"
        @keyup.enter="updateFormats('hsl', hslInput)"
      >
        <template #prepend>HSL</template>
        <template #append>
          <el-button @click="updateFormats('hsl', hslInput)">转换</el-button>
        </template>
      </el-input>
    </div>

    <div class="result-section">
      <el-input v-model="convertedFormats.hex" readonly>
        <template #prepend>HEX</template>
        <template #append>
          <el-button @click="copyToClipboard(convertedFormats.hex)">复制</el-button>
        </template>
      </el-input>
      <el-input v-model="convertedFormats.rgb" readonly>
        <template #prepend>RGB</template>
        <template #append>
          <el-button @click="copyToClipboard(convertedFormats.rgb)">复制</el-button>
        </template>
      </el-input>
      <el-input v-model="convertedFormats.rgba" readonly>
        <template #prepend>RGBA</template>
        <template #append>
          <el-button @click="copyToClipboard(convertedFormats.rgba)">复制</el-button>
        </template>
      </el-input>
      <el-input v-model="convertedFormats.hsl" readonly>
        <template #prepend>HSL</template>
        <template #append>
          <el-button @click="copyToClipboard(convertedFormats.hsl)">复制</el-button>
        </template>
      </el-input>
      <el-input v-model="convertedFormats.hsla" readonly>
        <template #prepend>HSLA</template>
        <template #append>
          <el-button @click="copyToClipboard(convertedFormats.hsla)">复制</el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<style scoped>
.color-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview {
  width: 80px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}

.color-value {
  font-family: monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.convert-section,
.result-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
