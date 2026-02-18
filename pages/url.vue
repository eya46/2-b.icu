<script setup lang="ts">
const rawData = ref("");
const encodedData = ref("");

const encodeUrl = () => {
  try {
    const input = rawData.value;

    // Check if input looks like a URL (starts with http:// or https://)
    const urlMatch = input.match(/^(https?:\/\/[^/]+)(\/.*)?$/);

    if (urlMatch) {
      // It's a URL, only encode the path part
      const baseUrl = urlMatch[1]; // protocol + domain
      const pathPart = urlMatch[2] || ""; // everything after domain

      if (pathPart) {
        // Split by / and encode each segment
        const segments = pathPart.split("/");
        const encodedPath = segments.map((segment, idx) => {
          if (idx === 0) return ""; // First element is empty before leading /

          // Handle query string
          if (segment.includes("?")) {
            const [path, query] = segment.split("?");
            const encodedPathSeg = encodeURIComponent(path);
            const encodedQuery = query.split("&").map((param) => {
              const eqIdx = param.indexOf("=");
              if (eqIdx === -1) {
                return encodeURIComponent(param);
              }
              const key = param.substring(0, eqIdx);
              const value = param.substring(eqIdx + 1);
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }).join("&");
            return `${encodedPathSeg}?${encodedQuery}`;
          }

          // Handle fragment
          if (segment.includes("#")) {
            const [path, hash] = segment.split("#");
            return `${encodeURIComponent(path)}#${encodeURIComponent(hash)}`;
          }

          return encodeURIComponent(segment);
        }).join("/");

        encodedData.value = baseUrl + encodedPath;
      } else {
        encodedData.value = baseUrl;
      }
    } else {
      // Not a URL, encode everything
      encodedData.value = encodeURIComponent(input);
    }

    ElMessage.success("编码成功");
  } catch {
    ElMessage.error("编码失败");
  }
};

const decodeUrl = () => {
  try {
    const input = encodedData.value;

    // Check if input looks like a URL (starts with http:// or https://)
    const urlMatch = input.match(/^(https?:\/\/[^/]+)(\/.*)?$/);

    if (urlMatch) {
      // It's a URL, only decode the path part
      const baseUrl = urlMatch[1]; // protocol + domain
      const pathPart = urlMatch[2] || ""; // everything after domain

      if (pathPart) {
        // Split by / and decode each segment
        const segments = pathPart.split("/");
        const decodedPath = segments.map((segment, idx) => {
          if (idx === 0) return ""; // First element is empty before leading /

          // Handle query string
          if (segment.includes("?")) {
            const [path, query] = segment.split("?");
            const decodedPathSeg = decodeURIComponent(path);
            const decodedQuery = query.split("&").map((param) => {
              const eqIdx = param.indexOf("=");
              if (eqIdx === -1) {
                return decodeURIComponent(param);
              }
              const key = param.substring(0, eqIdx);
              const value = param.substring(eqIdx + 1);
              return `${decodeURIComponent(key)}=${decodeURIComponent(value)}`;
            }).join("&");
            return `${decodedPathSeg}?${decodedQuery}`;
          }

          // Handle fragment
          if (segment.includes("#")) {
            const [path, hash] = segment.split("#");
            return `${decodeURIComponent(path)}#${decodeURIComponent(hash)}`;
          }

          return decodeURIComponent(segment);
        }).join("/");

        rawData.value = baseUrl + decodedPath;
      } else {
        rawData.value = baseUrl;
      }
    } else {
      // Not a URL, decode everything
      rawData.value = decodeURIComponent(input);
    }

    ElMessage.success("解码成功");
  } catch {
    ElMessage.error("解码失败");
  }
};

const copyRaw = async () => {
  if (!rawData.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(rawData.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const copyEncoded = async () => {
  if (!encodedData.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(encodedData.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const clearAll = () => {
  rawData.value = "";
  encodedData.value = "";
};
</script>

<template>
  <div class="url-container">
    <div class="content-wrapper">
      <el-row :gutter="16">
        <el-col>
          <el-button type="primary" size="large" @click="encodeUrl">
            编码 → URL
          </el-button>
          <el-button type="primary" size="large" @click="decodeUrl">
            解码 → 原始
          </el-button>
          <el-button size="large" @click="clearAll">
            清空
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="input-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">原始数据</span>
                <el-button type="primary" size="small" link @click="copyRaw">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="10"
              v-model="rawData"
              type="textarea"
              placeholder="输入原始文本或 URL..."
              class="code-textarea"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="input-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">URL 编码</span>
                <el-button type="primary" size="small" link @click="copyEncoded">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="10"
              v-model="encodedData"
              type="textarea"
              placeholder="输入 URL 编码字符串..."
              class="code-textarea"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.url-container {
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.input-card {
  margin-top: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.code-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  border-radius: 6px;
}
</style>
