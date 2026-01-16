<script setup lang="ts">
import PostalMime from "postal-mime";
import type { UploadFile } from "element-plus";

type ParsedEmail = Awaited<ReturnType<PostalMime["parse"]>>;

const rawEmail = ref("");
const parsed = ref<ParsedEmail | null>(null);
const parseError = ref("");
const isParsing = ref(false);
const shouldUnescape = ref(true);
const lastNormalizedRaw = ref("");

const extraHeaderKeys = [
  { key: "X-Priority", label: "优先级" },
  { key: "X-QQ-MIME", label: "X-QQ-MIME" },
  { key: "X-Mailer", label: "X-Mailer" },
  { key: "X-QQ-Mailer", label: "X-QQ-Mailer" },
  { key: "X-QQ-mid", label: "X-QQ-mid" },
] as const;

const formatHeaderValue = (value: unknown) => {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(formatHeaderValue).filter(Boolean).join(", ");
  }
  return String(value);
};

const getHeaderValue = (headers: unknown, name: string) => {
  if (!headers) {
    return "";
  }
  const lower = name.toLowerCase();
  const maybeMap = headers as Map<string, unknown>;
  if (typeof maybeMap.get === "function") {
    const direct = maybeMap.get(name) ?? maybeMap.get(lower);
    if (direct) {
      return formatHeaderValue(direct);
    }
    for (const [key, value] of maybeMap) {
      if (key.toLowerCase() === lower) {
        return formatHeaderValue(value);
      }
    }
  }
  const record = headers as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === lower) {
      return formatHeaderValue(value);
    }
  }
  return "";
};

const extraHeaders = computed(() => {
  const headers = parsed.value?.headers;
  const fallbackHeaders = parseHeadersFromRaw(lastNormalizedRaw.value);
  if (!headers && !Object.keys(fallbackHeaders).length) {
    return [];
  }
  return extraHeaderKeys
    .map((item) => ({
      ...item,
      value: getHeaderValue(headers, item.key) || getHeaderValue(fallbackHeaders, item.key),
    }))
    .filter((item) => item.value);
});

const messageId = computed(() => {
  const headers = parsed.value?.headers;
  const fallbackHeaders = parseHeadersFromRaw(lastNormalizedRaw.value);
  return getHeaderValue(headers, "Message-ID") || getHeaderValue(fallbackHeaders, "Message-ID");
});

const normalizeRawEmail = (input: string) => {
  let normalized = input;
  if (!shouldUnescape.value) {
    normalized = input;
  } else {
    normalized = input.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  }
  const withLf = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = withLf.split("\n");
  let inHeaders = true;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (inHeaders && line === "") {
      inHeaders = false;
      continue;
    }
    if (!inHeaders) {
      continue;
    }
    if (i === 0 || !line) {
      continue;
    }
    if (line.includes(":")) {
      continue;
    }
    if (/^[ \t]/.test(line)) {
      continue;
    }
    if (line.startsWith("--")) {
      continue;
    }
    lines[i] = ` ${line}`;
  }
  return lines.join("\r\n");
};

const parseHeadersFromRaw = (raw: string) => {
  const result: Record<string, string> = {};
  if (!raw) {
    return result;
  }
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let currentKey = "";
  for (const line of lines) {
    if (!line) {
      break;
    }
    if (/^[ \t]/.test(line) && currentKey) {
      result[currentKey] = `${result[currentKey]} ${line.trim()}`;
      continue;
    }
    const sepIndex = line.indexOf(":");
    if (sepIndex === -1) {
      continue;
    }
    currentKey = line.slice(0, sepIndex).trim().toLowerCase();
    result[currentKey] = line.slice(sepIndex + 1).trim();
  }
  return result;
};

const formatAddress = (input: unknown) => {
  if (!input) {
    return "";
  }
  if (typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(formatAddress).filter(Boolean).join(", ");
  }
  if (typeof input === "object") {
    const maybeValue = input as { value?: unknown; address?: string; name?: string };
    if (Array.isArray(maybeValue.value)) {
      return maybeValue.value.map(formatAddress).filter(Boolean).join(", ");
    }
    if (maybeValue.address) {
      return maybeValue.name ? `${maybeValue.name} <${maybeValue.address}>` : maybeValue.address;
    }
  }
  return String(input);
};

const parseRawEmail = async () => {
  if (!rawEmail.value.trim()) {
    ElMessage({
      message: "请先粘贴邮件原文或选择 .eml 文件",
      type: "warning",
    });
    return;
  }
  isParsing.value = true;
  parseError.value = "";
  try {
    const normalized = normalizeRawEmail(rawEmail.value);
    lastNormalizedRaw.value = normalized;
    parsed.value = await new PostalMime().parse(normalized);
    ElMessage({
      message: "解析成功",
      type: "success",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    parseError.value = message;
    ElMessage({
      message,
      type: "error",
    });
  } finally {
    isParsing.value = false;
  }
};

const resetAll = () => {
  rawEmail.value = "";
  parsed.value = null;
  parseError.value = "";
};

const handleFileChange = async (file: UploadFile) => {
  if (!file.raw) {
    return;
  }
  try {
    rawEmail.value = await file.raw.text();
    ElMessage({
      message: "已读取邮件文件，点击解析即可",
      type: "success",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取文件失败";
    ElMessage({
      message,
      type: "error",
    });
  }
};
</script>

<template>
  <el-space direction="vertical" alignment="stretch" :size="16" :fill="true" :fill-ratio="100" class="mail-parser">
    <el-card shadow="never" class="mail-card">
      <template #header>
        <div class="mail-card-title">邮件解析（PostalMime）</div>
      </template>
      <el-space direction="vertical" alignment="stretch" :size="12" :fill="true" :fill-ratio="100" class="mail-inputs">
        <el-space alignment="center" :size="12" class="mail-toolbar">
          <el-upload :auto-upload="false" :show-file-list="false" accept=".eml,message/rfc822,text/plain"
            :on-change="handleFileChange">
            <el-button>选择 .eml 文件</el-button>
          </el-upload>
          <div class="mail-toggle">
            <span class="mail-toggle-label">自动转义</span>
            <el-switch v-model="shouldUnescape" />
          </div>
        </el-space>
        <el-input v-model="rawEmail" type="textarea" :rows="10" placeholder="粘贴邮件原文（MIME/EML）" />
        <el-space alignment="center" :size="12">
          <el-button type="primary" :loading="isParsing" @click="parseRawEmail">
            解析邮件
          </el-button>
          <el-button @click="resetAll">清空</el-button>
        </el-space>
        <el-alert v-if="parseError" :title="parseError" type="error" show-icon />
      </el-space>
    </el-card>

    <el-card v-if="parsed" shadow="never" class="mail-card">
      <template #header>
        <div class="mail-card-title">解析结果</div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="主题">
          {{ parsed.subject || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="发件人">
          {{ formatAddress(parsed.from) || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="收件人">
          {{ formatAddress(parsed.to) || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="抄送">
          {{ formatAddress(parsed.cc) || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="密送">
          {{ formatAddress(parsed.bcc) || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="日期">
          {{ parsed.date ? new Date(parsed.date).toLocaleString() : "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Message-ID">
          {{ messageId || "-" }}
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions v-if="extraHeaders.length" :column="1" border class="mail-extra">
        <el-descriptions-item v-for="item in extraHeaders" :key="item.key" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs class="mail-tabs">
        <el-tab-pane label="纯文本">
          <el-input :rows="8" type="textarea" :model-value="parsed.text || ''" />
        </el-tab-pane>
        <el-tab-pane label="HTML 源码">
          <el-input :rows="8" type="textarea" :model-value="parsed.html || ''" />
        </el-tab-pane>
        <el-tab-pane label="附件">
          <el-table :data="parsed.attachments || []" style="width: 100%">
            <el-table-column prop="filename" label="文件名" />
            <el-table-column prop="mimeType" label="类型" width="180" />
            <el-table-column prop="size" label="大小 (bytes)" width="140" />
          </el-table>
          <div v-if="!parsed.attachments?.length" class="mail-empty">
            无附件
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </el-space>
</template>

<style scoped>
.mail-parser {
  width: 100%;
}

.mail-card {
  width: 100%;
}

.mail-card-title {
  font-weight: 700;
}

.mail-inputs {
  width: 100%;
}

.mail-toolbar {
  width: 100%;
  justify-content: space-between;
}

.mail-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
}

.mail-toggle-label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  white-space: nowrap;
}

.mail-tabs {
  margin-top: 16px;
}

.mail-extra {
  margin-top: 16px;
}

.mail-empty {
  margin-top: 12px;
  color: var(--el-text-color-secondary);
}
</style>
