<script setup lang="ts">
const rawData = ref("");
const base64Data = ref("");

const toBase64 = () => {
  try {
    base64Data.value = btoa(rawData.value);
    ElMessage.success("编码成功");
  } catch {
    ElMessage.error("编码失败");
  }
};

const toRaw = () => {
  try {
    rawData.value = atob(base64Data.value);
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

const copyBase64 = async () => {
  if (!base64Data.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(base64Data.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const clearAll = () => {
  rawData.value = "";
  base64Data.value = "";
};
</script>

<template>
  <div class="base64-container">
    <div class="content-wrapper">
      <el-row :gutter="16">
        <el-col>
          <el-button type="primary" size="large" @click="toBase64">
            编码 → Base64
          </el-button>
          <el-button type="primary" size="large" @click="toRaw">
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
              placeholder="输入原始文本..."
              class="code-textarea"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="input-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">Base64</span>
                <el-button type="primary" size="small" link @click="copyBase64">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="10"
              v-model="base64Data"
              type="textarea"
              placeholder="输入 Base64 字符串..."
              class="code-textarea"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.base64-container {
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
