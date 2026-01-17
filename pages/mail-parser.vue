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
const showDebugInfo = ref(false);

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
      message: "已读取邮件文件，正在解析...",
      type: "success",
    });
    // 自动解析
    await parseRawEmail();
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取文件失败";
    ElMessage({
      message,
      type: "error",
    });
  }
};

const formatFileSize = (attachment: any) => {
  // 尝试不同的大小字段名
  let bytes = attachment.size || attachment.length || attachment.contentLength;

  // 如果没有直接的大小信息，尝试从content计算
  if (!bytes && attachment.content) {
    if (attachment.content instanceof Uint8Array) {
      bytes = attachment.content.length;
    } else if (attachment.content instanceof ArrayBuffer) {
      bytes = attachment.content.byteLength;
    } else if (typeof attachment.content === 'string') {
      // 如果是base64，估算原始大小（base64比原始数据大约33%）
      bytes = Math.floor(attachment.content.length * 0.75);
    }
  }

  if (!bytes || bytes === 0) return "-";

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const downloadAttachment = (attachment: any) => {
  try {
    if (!attachment.content) {
      ElMessage({
        message: "附件内容为空",
        type: "warning",
      });
      return;
    }

    // 将不同格式转换为Blob
    let blob: Blob;

    // 检查是否是Uint8Array（最常见的情况）
    if (attachment.content instanceof Uint8Array) {
      blob = new Blob([attachment.content], { type: attachment.mimeType || 'application/octet-stream' });
    }
    // 检查是否是ArrayBuffer
    else if (attachment.content instanceof ArrayBuffer) {
      blob = new Blob([attachment.content], { type: attachment.mimeType || 'application/octet-stream' });
    }
    // 检查是否是base64字符串
    else if (typeof attachment.content === 'string') {
      try {
        const binaryString = atob(attachment.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: attachment.mimeType || 'application/octet-stream' });
      } catch (decodeError) {
        // 如果不是base64，尝试直接作为文本内容
        blob = new Blob([attachment.content], { type: attachment.mimeType || 'text/plain' });
      }
    }
    // 检查是否有其他格式
    else {
      ElMessage({
        message: `不支持的附件格式: ${typeof attachment.content}。请查看调试信息了解详情。`,
        type: "error",
      });
      return;
    }

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename || 'attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    ElMessage({
      message: `下载 ${attachment.filename} 成功`,
      type: "success",
    });
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage({
      message: "下载失败，请查看调试信息了解详情",
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
        <el-tab-pane label="HTML 预览">
          <div class="html-preview-container">
            <div v-if="parsed.html" class="html-preview" v-html="parsed.html"></div>
            <div v-else class="mail-empty">
              无HTML内容
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="附件">
          <div v-if="parsed.attachments?.length" style="margin-bottom: 16px;">
            <el-button
              size="small"
              type="info"
              @click="showDebugInfo = !showDebugInfo"
            >
              {{ showDebugInfo ? '隐藏' : '显示' }}调试信息
            </el-button>
          </div>

          <el-table :data="parsed.attachments || []" style="width: 100%">
            <el-table-column prop="filename" label="文件名" min-width="200" />
            <el-table-column prop="mimeType" label="类型" width="180" />
            <el-table-column label="大小" width="120">
              <template #default="{ row }">
                {{ formatFileSize(row) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="downloadAttachment(row)"
                  :disabled="!row.content"
                >
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="showDebugInfo && parsed.attachments?.length" class="debug-info">
            <h4>附件调试信息：</h4>
            <pre v-for="(attachment, index) in parsed.attachments" :key="index" class="debug-attachment">
附件 {{ index + 1 }}:
{{ JSON.stringify(attachment, null, 2) }}
            </pre>
          </div>

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
  padding-bottom: 32px;
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

.debug-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.debug-info h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
}

.debug-attachment {
  margin: 8px 0;
  padding: 8px;
  background: var(--el-bg-color);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.html-preview-container {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  min-height: 200px;
}

.html-preview {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  overflow: auto;
  max-height: 500px;
  word-wrap: break-word;
}

.html-preview img {
  max-width: 100%;
  height: auto;
}

.html-preview table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.html-preview table,
.html-preview th,
.html-preview td {
  border: 1px solid #ddd;
}

.html-preview th,
.html-preview td {
  padding: 8px;
  text-align: left;
}
</style>
