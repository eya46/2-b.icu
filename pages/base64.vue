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
    <el-space direction="vertical" :size="16" style="width: 100%">
      <el-row :gutter="12">
        <el-col>
          <el-button type="primary" size="large" @click="toBase64">
            编码
          </el-button>
          <el-button type="primary" size="large" @click="toRaw">
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
                <span>原始数据</span>
                <el-button type="primary" size="small" @click="copyRaw">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="6"
              v-model="rawData"
              type="textarea"
              placeholder="原始数据"
            />
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>Base64</span>
                <el-button type="primary" size="small" @click="copyBase64">
                  复制
                </el-button>
              </div>
            </template>
            <el-input
              :rows="6"
              v-model="base64Data"
              type="textarea"
              placeholder="base64"
            />
          </el-card>
        </el-col>
      </el-row>
    </el-space>
  </div>
</template>

<style scoped>
.base64-container {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
