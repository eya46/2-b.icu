<script setup lang="ts">
import qrcode from "../utils/qrcode";
import { TYPES as PIC_TYPES } from "../utils/qrcode";

const data = ref("114514");
const margin = ref(2);
const width = ref(200);
const color = reactive({
  dark: "#000000",
  light: "#87CEEB",
});
const quality = ref(1.0);
const mask = ref(0);


const mime: typeof PIC_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
const mimeType = ref(mime[0]);


const writeToClipboard = () => {
  navigator.clipboard.writeText("").then(() => {
    console.log("Copied to clipboard");
  });
};


</script>

<template>
  <el-space wrap alignment="flex-start">
    <el-form label-width="auto" style="min-width: 15em;max-width: 100vw">
      <el-form-item label="Type">
        <el-select v-model="mimeType">
          <el-option v-for="item in mime" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="Data">
        <el-input :rows="5" v-model="data" type="textarea" placeholder="内容" />
      </el-form-item>
      <el-form-item label="Margin">
        <el-input-number v-model="margin" :min="0" />
      </el-form-item>
      <el-form-item label="Width">
        <el-input-number v-model="width" :min="0" />
      </el-form-item>
      <el-form-item label="BgColor">
        <el-color-picker v-model="color.light" />
      </el-form-item>
      <el-form-item label="Color">
        <el-color-picker v-model="color.dark" />
      </el-form-item>
      <el-form-item label="Quality">
        <el-input-number v-model="quality" :min="0" :max="1" :step="0.01" />
      </el-form-item>
      <el-form-item label="Mask">
        <el-input-number v-model="mask" :min="0" :max="7" />
      </el-form-item>
    </el-form>

    <qrcode :mask-pattern="mask" :margin="margin" :width="width" :color="color"
            :quality="quality" :value="data"
            :type="mimeType" />
  </el-space>
</template>

<style scoped>

</style>
