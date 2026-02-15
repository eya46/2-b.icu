<script setup lang="ts">

const rawData = ref("");
const encodedData = ref("");


const encodeUrl = () => {
  try {
    encodedData.value = encodeURIComponent(rawData.value);
    ElMessage({
      message: "编码成功",
      type: "success",
    });
  } catch (e) {
    ElMessage({
      message: "编码失败",
      type: "error",
    });
  }
};

const decodeUrl = () => {
  try {
    rawData.value = decodeURIComponent(encodedData.value);
    ElMessage({
      message: "解码成功",
      type: "success",
    });
  } catch (e) {
    ElMessage({
      message: "解码失败",
      type: "error",
    });
  }

};
</script>

<template>
  <el-row :gutter="20">
    <el-col>
      <el-button @click="encodeUrl" size="large">
        编码
      </el-button>
      <el-button @click="decodeUrl" size="large">
        解码
      </el-button>
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col>
      <el-input :rows="5" v-model="rawData" type="textarea" placeholder="原始数据"/>
    </el-col>
    <el-col>
      <el-input :rows="5" v-model="encodedData" type="textarea" placeholder="URL编码"/>
    </el-col>
  </el-row>
</template>

<style scoped>
.el-col {
  margin: 1em 0;
}
</style>
