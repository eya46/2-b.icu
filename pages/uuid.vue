<script setup lang="ts">
import { v4 } from "uuid";

const num = ref( 5);

const uuids = ref<string[]>([]);


const refresh = () => {
  uuids.value = Array.from({ length: num.value }, () => v4());
};

const refreshByNum = () => {
  if (uuids.value.length > num.value) {
    uuids.value = uuids.value.slice(0, num.value);
  } else if (uuids.value.length < num.value) {
    uuids.value = uuids.value.concat(Array.from({ length: num.value - uuids.value.length }, () => v4()));
  }
};

onBeforeMount(() => {
  refresh();
});

const uuidsStr = computed(() => uuids.value.join("\n") + "\n");
</script>

<template>
  <div class="uuid-page">
    <div class="uuid-actions">
      <el-input-number v-model="num" :min="1" @change="refreshByNum" />
      <el-button @click="refresh">刷新</el-button>
    </div>

    <el-input
      class="uuid-result"
      readonly
      resize="none"
      :rows="num + 1"
      :model-value="uuidsStr"
      type="textarea"
    />
  </div>
</template>

<style scoped>
.uuid-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.uuid-result {
  margin-top: 12px;
}

</style>
