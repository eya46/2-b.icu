<script setup lang="ts">
import { v4 } from "uuid";

const num = ref(5);
const uuids = ref<string[]>([]);

const refresh = () => {
  uuids.value = Array.from({ length: num.value }, () => v4());
};

const refreshByNum = () => {
  if (uuids.value.length > num.value) {
    uuids.value = uuids.value.slice(0, num.value);
  } else if (uuids.value.length < num.value) {
    uuids.value = uuids.value.concat(
      Array.from({ length: num.value - uuids.value.length }, () => v4())
    );
  }
};

onBeforeMount(() => {
  refresh();
});

const uuidsStr = computed(() => uuids.value.join("\n") + "\n");

const copyResult = async () => {
  if (uuids.value.length === 0) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(uuidsStr.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};
</script>

<template>
  <div class="uuid-container">
    <div class="content-wrapper">
      <el-row :gutter="16" align="middle">
        <el-col :xs="24" :md="6">
          <el-input-number
            v-model="num"
            :min="1"
            :max="100"
            label="生成数量"
            style="width: 100%"
            @change="refreshByNum"
          />
        </el-col>
        <el-col :xs="24" :md="18">
          <el-button type="primary" size="large" @click="refresh">
            刷新
          </el-button>
          <el-button size="large" @click="copyResult">
            复制
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col>
          <el-card shadow="never" class="result-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">UUID 列表</span>
                <span class="card-count">{{ uuids.length }} 个</span>
              </div>
            </template>
            <div class="result-display">{{ uuidsStr }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.uuid-container {
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.result-card {
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

.card-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.result-display {
  padding: 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.result-display::-webkit-scrollbar {
  width: 6px;
}

.result-display::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}
</style>
