<script setup lang="ts">
const rawUrl = ref("");
const encodedUrl = ref("");

const encode = () => {
  try {
    encodedUrl.value = encodeURIComponent(rawUrl.value);
    ElMessage.success("编码成功");
  } catch {
    ElMessage.error("编码失败");
  }
};

const decode = () => {
  try {
    rawUrl.value = decodeURIComponent(encodedUrl.value);
    ElMessage.success("解码成功");
  } catch {
    ElMessage.error("解码失败");
  }
};

const copyRaw = async () => {
  if (!rawUrl.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(rawUrl.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const copyEncoded = async () => {
  if (!encodedUrl.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(encodedUrl.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const clearAll = () => {
  rawUrl.value = "";
  encodedUrl.value = "";
};
</script>

<template>
  <div class="url-container">
    <el-space direction="vertical" :size="16" style="width: 100%">
      <el-row :gutter="12">
        <el-col>
          <el-button type="primary" size="large" @click="encode">
            编码
          </el-button>
          <el-button type="primary" size="large" @click="decode">
            解码
          </el-button>
          <el-button size="large" @click="clearAll">
            清空
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>原始 URL</span>
                <el-button type="primary" size="small" @click="copyRaw">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="6"
              v-model="rawUrl"
              type="textarea"
              placeholder="原始 URL"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>编码后 URL</span>
                <el-button type="primary" size="small" @click="copyEncoded">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="6"
              v-model="encodedUrl"
              type="textarea"
              placeholder="编码后 URL"
            />
          </el-card>
        </el-col>
      </el-row>
    </el-space>
  </div>
</template>

<style scoped>
.url-container {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
