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
    <el-space direction="vertical" :size="16" style="width: 100%">
      <el-row :gutter="12" align="middle">
        <el-col :span="6">
          <el-input-number
            v-model="num"
            :min="1"
            :max="100"
            label="生成数量"
            style="width: 100%"
            @change="refreshByNum"
          />
        </el-col>
        <el-col :span="18">
          <el-button type="primary" size="large" @click="refresh">
            刷新
          </el-button>
          <el-button size="large" @click="copyResult">
            复制
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col>
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>UUID 列表</span>
              </div>
            </template>
            <el-input
              readonly
              resize="none"
              :rows="num + 1"
              :model-value="uuidsStr"
              type="textarea"
            />
          </el-card>
        </el-col>
      </el-row>
    </el-space>
  </div>
</template>

<style scoped>
.uuid-container {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
