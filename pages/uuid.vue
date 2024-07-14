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
  <div>
    <el-input-number @change="refreshByNum" v-model="num" :min="1" />
    <el-button @click="refresh">
      刷新
    </el-button>
    <el-input readonly resize="none" :rows="num+1" :model-value="uuidsStr" type="textarea" />
  </div>
</template>

<style scoped>

</style>
