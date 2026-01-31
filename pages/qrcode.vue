<script setup lang="ts">
import qrcode from "../utils/qrcode";
import { TYPES as PIC_TYPES } from "../utils/qrcode";

const data = ref("114514");
const margin = ref(2);
const width = ref(200);
const color = reactive({
  dark: "#000000",
  light: "#87CEEB",
});
const quality = ref(1.0);
const mask = ref<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>(0);
const errorMsg = ref("");
const qrDataUrl = ref("");
const mode = ref<"auto" | "numeric" | "alphanumeric" | "byte" | "kanji">("auto");
const errorLevel = ref<"L" | "M" | "Q" | "H">("M");

const mime: typeof PIC_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
const mimeType = ref(mime[0]);

// QR Code Version 40 各模式在各纠错级别下的容量
const CAPACITY = {
  numeric: { L: 7089, M: 5596, Q: 3993, H: 3057 },
  alphanumeric: { L: 4296, M: 3391, Q: 2420, H: 1852 },
  byte: { L: 2953, M: 2331, Q: 1663, H: 1273 },
  kanji: { L: 1817, M: 1435, Q: 1024, H: 784 },
} as const;

const errorLevelOptions = [
  { label: "L - 低 (~7%)", value: "L" },
  { label: "M - 中 (~15%)", value: "M" },
  { label: "Q - 高 (~25%)", value: "Q" },
  { label: "H - 最高 (~30%)", value: "H" },
];

const modeOptions = [
  { label: "自动 (Auto)", value: "auto" },
  { label: "数字 (Numeric)", value: "numeric" },
  { label: "字母数字 (Alphanumeric)", value: "alphanumeric" },
  { label: "字节/UTF-8 (Byte)", value: "byte" },
  { label: "日文汉字 (Kanji)", value: "kanji" },
];

const currentCapacity = computed(() => {
  const level = errorLevel.value;
  if (mode.value === "auto") {
    // 自动模式下估算：优先检测是否纯数字，然后字母数字，否则按字节
    if (/^\d*$/.test(data.value)) return CAPACITY.numeric[level]!;
    if (/^[0-9A-Z $%*+\-./:]*$/i.test(data.value)) return CAPACITY.alphanumeric[level]!;
    return CAPACITY.byte[level]!;
  }
  return CAPACITY[mode.value as keyof typeof CAPACITY]?.[level] ?? CAPACITY.byte[level]!;
});

const currentModeText = computed(() => {
  if (mode.value === "auto") {
    if (/^\d*$/.test(data.value)) return "数字模式";
    if (/^[0-9A-Z $%*+\-./:]*$/i.test(data.value)) return "字母数字模式";
    return "字节模式";
  }
  const labels: Record<string, string> = {
    numeric: "数字模式",
    alphanumeric: "字母数字模式",
    byte: "字节模式",
    kanji: "日文汉字模式",
  };
  return labels[mode.value] || mode.value;
});

// 防抖后的数据，避免频繁生成二维码
const debouncedData = ref(data.value);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const clearError = () => {
  errorMsg.value = "";
};

watch(data, (newVal) => {
  clearError();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debouncedData.value = newVal;
  }, 300);
});

// 配置变化时立即重新生成并清空错误
watch([mode, errorLevel], () => {
  clearError();
  debouncedData.value = data.value;
});

const onQrSuccess = (dataUrl: string) => {
  errorMsg.value = "";
  qrDataUrl.value = dataUrl;
};

const exportImage = () => {
  if (!qrDataUrl.value) {
    ElMessage.warning("请先生成二维码");
    return;
  }
  const link = document.createElement("a");
  link.href = qrDataUrl.value;
  link.download = `qrcode-${Date.now()}.${mimeType.value.split("/")[1]}`;
  link.click();
  ElMessage.success("导出成功");
};

const onQrError = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("code length overflow") || message.includes("capacity")) {
    errorMsg.value = "数据超出二维码容量限制（最多约 4000 个字符）";
  } else {
    errorMsg.value = message;
  }
};

// 验证当前模式是否支持输入内容
const validationError = computed(() => {
  if (!data.value || mode.value === "auto") return "";

  switch (mode.value) {
    case "numeric":
      if (!/^\d*$/.test(data.value)) {
        return "数字模式仅支持 0-9 的数字";
      }
      break;
    case "alphanumeric":
      if (!/^[0-9A-Z $%*+\-./:]*$/.test(data.value)) {
        return "字母数字模式仅支持：0-9、A-Z（大写）、空格、$%*+-./:";
      }
      break;
    case "kanji":
      // 简单检查：日文汉字/假名范围
      // eslint-disable-next-line no-control-regex
      if (/^[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]*$/.test(data.value)) {
        return "";
      }
      // 允许空或混合，但给出提示
      return "";
  }
  return "";
});

const charCount = computed(() => data.value.length);
const isNearLimit = computed(() => charCount.value > currentCapacity.value! * 0.8);
const isOverLimit = computed(() => charCount.value > currentCapacity.value!);
</script>

<template>
  <el-row :gutter="24">
    <el-col :xs="24" :sm="12" :md="10" :lg="8">
      <el-form label-width="auto" style="min-width: 15em" label-position="left">
        <el-form-item label="Type">
          <el-select v-model="mimeType" style="width: 100%">
            <el-option v-for="item in mime" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Mode">
          <el-select v-model="mode" style="width: 100%">
            <el-option v-for="item in modeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Error Level">
          <el-select v-model="errorLevel" style="width: 100%">
            <el-option v-for="item in errorLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Data">
          <el-input :rows="6" v-model="data" type="textarea" placeholder="输入要生成二维码的内容..." />
          <div class="char-count" :class="{ warning: isNearLimit, error: isOverLimit }">
            {{ charCount }} / {{ currentCapacity }} 字符
            <span v-if="mode === 'auto'">（{{ currentModeText }}）</span>
            <span v-if="isNearLimit && !isOverLimit" class="status-hint">（接近上限）</span>
            <span v-if="isOverLimit" class="status-hint error">（已超出限制）</span>
          </div>
          <div v-if="validationError" class="validation-error">{{ validationError }}</div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </el-form-item>
        <el-form-item label="Width">
          <el-input-number v-model="width" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="Margin">
          <el-input-number v-model="margin" :min="0" controls-position="right" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="BgColor">
              <el-color-picker v-model="color.light" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Color">
              <el-color-picker v-model="color.dark" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Quality">
          <el-input-number v-model="quality" :min="0" :max="1" :step="0.01" controls-position="right" />
        </el-form-item>
        <el-form-item label="Mask">
          <el-input-number v-model="mask" :min="0" :max="7" controls-position="right" />
        </el-form-item>
      </el-form>
    </el-col>

    <el-col :xs="24" :sm="12" :md="14" :lg="16">
      <div class="qrcode-preview">
        <qrcode :mask-pattern="mask" :margin="margin" :width="width" :color="color" :quality="quality"
          :value="debouncedData" :type="mimeType" :mode="mode" :error-correction-level="errorLevel"
          @error="onQrError" @change="onQrSuccess" />
      </div>
      <div class="export-btn-wrapper">
        <el-button type="primary" @click="exportImage">
          导出图片
        </el-button>
      </div>
    </el-col>
  </el-row>
</template>

<style scoped>
.char-count {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: right;
}

.char-count.warning {
  color: #e6a23c;
}

.char-count.error {
  color: #f56c6c;
}

.status-hint {
  margin-left: 4px;
}

.status-hint.error {
  color: #f56c6c;
  font-weight: bold;
}

.validation-error {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  line-height: 1.5;
}

.error-msg {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}

.qrcode-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 24px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.qrcode-preview :deep(img) {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  object-fit: contain;
}

@media (max-width: 768px) {
  .qrcode-preview {
    margin-top: 20px;
    min-height: 200px;
  }

  .qrcode-preview :deep(img) {
    max-height: 300px;
  }
}

.export-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
