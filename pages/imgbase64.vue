<script setup lang="ts">
type ParseResult = {
  mime: string;
  base64: string;
  dataUrl: string;
  hasPrefix: boolean;
};

const inputText = ref("");
const fallbackMime = ref<"image/png" | "image/jpeg" | "image/webp">("image/png");
const includePrefix = ref(true);
const downloadName = ref("");

const parseBase64Input = (input: string, fallback: string): { result?: ParseResult; error?: string } => {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const noWhitespace = trimmed.replace(/\s+/g, "");

  if (noWhitespace.startsWith("data:")) {
    const marker = ";base64,";
    const markerIndex = noWhitespace.indexOf(marker);
    if (markerIndex === -1) {
      return { error: "检测到 data: 前缀，但缺少 “;base64,”" };
    }

    const mime = noWhitespace.slice("data:".length, markerIndex);
    const base64 = noWhitespace.slice(markerIndex + marker.length);
    if (!mime) return { error: "资源前缀缺少 MIME 类型（例如 image/png）" };
    if (!base64) return { error: "Base64 内容为空" };

    return {
      result: {
        mime,
        base64,
        dataUrl: `data:${mime}${marker}${base64}`,
        hasPrefix: true,
      },
    };
  }

  const base64Raw = noWhitespace.replace(/-/g, "+").replace(/_/g, "/");
  if (!base64Raw) return { error: "Base64 内容为空" };
  if (/[^A-Za-z0-9+/=]/.test(base64Raw)) return { error: "Base64 含非法字符（仅支持标准 Base64 或去除空白后的内容）" };

  return {
    result: {
      mime: fallback,
      base64: base64Raw,
      dataUrl: `data:${fallback};base64,${base64Raw}`,
      hasPrefix: false,
    },
  };
};

const parsed = computed(() => parseBase64Input(inputText.value, fallbackMime.value));
const parsedResult = computed(() => parsed.value.result);
const parseError = computed(() => parsed.value.error);

const normalizedOutputText = computed(() => {
  if (!parsedResult.value) return "";
  return includePrefix.value ? parsedResult.value.dataUrl : parsedResult.value.base64;
});

const previewUrl = computed(() => parsedResult.value?.dataUrl ?? "");

const extensionFromMime = (mime: string) => {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
};

const downloadFileName = computed(() => {
  const result = parsedResult.value;
  const ext = extensionFromMime(result?.mime ?? fallbackMime.value);
  const base = downloadName.value.trim() || "image";
  return base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`;
});

const base64ToBlob = (base64: string, mime: string) => {
  const atobFn = globalThis.atob;
  if (!atobFn) throw new Error("atob is not available");

  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

const handleUploadChange = (uploadFile: { raw?: File; name?: string }) => {
  const file = uploadFile.raw;
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = String(reader.result || "");
    const nextText = includePrefix.value ? dataUrl : dataUrl.replace(/^data:[^;]+;base64,/, "");
    inputText.value = nextText;
    if (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp") {
      fallbackMime.value = file.type;
    }
    if (!downloadName.value) downloadName.value = file.name.replace(/\.[^.]+$/, "");
  };
  reader.onerror = () => {
    ElMessage({ message: "读取图片失败", type: "error" });
  };
  reader.readAsDataURL(file);
};

const copyOutput = async () => {
  const text = normalizedOutputText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage({ message: "已复制", type: "success" });
  } catch {
    ElMessage({ message: "复制失败（可能未授权剪贴板）", type: "error" });
  }
};

const downloadImage = () => {
  const result = parsedResult.value;
  if (!result) return;

  try {
    const blob = base64ToBlob(result.base64, result.mime);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName.value;
    a.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    ElMessage({ message: "保存失败（Base64 可能无效）", type: "error" });
  }
};

const clearAll = () => {
  inputText.value = "";
};
</script>

<template>
  <el-row :gutter="16" class="imgb64-layout">
    <el-col :xs="24" :sm="14">
      <el-card shadow="never">
        <template #header>
          <div class="imgb64-header">
            <div class="imgb64-title">图片 ↔ Base64</div>
            <el-switch v-model="includePrefix" active-text="带资源前缀" inactive-text="纯 Base64" />
          </div>
        </template>

        <el-space wrap :size="12">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleUploadChange"
          >
            <el-button type="primary">上传图片</el-button>
          </el-upload>

          <el-button :disabled="!normalizedOutputText" @click="copyOutput">复制文本</el-button>

          <el-button :disabled="!parsedResult" @click="downloadImage">保存图片</el-button>

          <el-button :disabled="!inputText" @click="clearAll">清空</el-button>
        </el-space>

        <div class="imgb64-form">
          <el-form label-position="top">
            <el-form-item label="Base64 文本（支持 data:*;base64, 前缀）">
              <el-input
                v-model="inputText"
                type="textarea"
                :rows="10"
                placeholder="粘贴 Base64 或 data:image/png;base64,..."
              />
            </el-form-item>

            <el-row :gutter="12">
              <el-col :xs="24" :sm="12">
                <el-form-item label="无前缀时的图片类型">
                  <el-select v-model="fallbackMime">
                    <el-option label="image/png" value="image/png" />
                    <el-option label="image/jpeg" value="image/jpeg" />
                    <el-option label="image/webp" value="image/webp" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="保存文件名">
                  <el-input v-model="downloadName" placeholder="image" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="识别结果">
                  <div class="imgb64-meta">
                    <div>MIME：{{ parsedResult?.mime || "-" }}</div>
                    <div>来源：{{ parsedResult ? (parsedResult.hasPrefix ? "带前缀" : "无前缀") : "-" }}</div>
                    <div>文件：{{ parsedResult ? downloadFileName : "-" }}</div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-alert v-if="parseError" :closable="false" type="warning" :title="parseError" />
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="10">
      <el-card shadow="never">
        <template #header>预览</template>
        <div class="imgb64-preview">
          <el-image
            v-if="previewUrl"
            :src="previewUrl"
            :preview-src-list="[previewUrl]"
            preview-teleported
            hide-on-click-modal
            fit="contain"
            class="imgb64-preview-img"
          />
          <el-empty v-else description="暂无图片" />
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.imgb64-layout {
  row-gap: 16px;
}

.imgb64-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.imgb64-title {
  font-weight: 700;
}

.imgb64-form {
  margin-top: 12px;
}

.imgb64-meta {
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.6;
}

.imgb64-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.imgb64-preview-img {
  width: 100%;
  max-height: 460px;
}
</style>
