<script setup lang="ts">

const rawData = ref("");
const encodedData = ref("");


const encodeUrl = () => {
  try {
    const input = rawData.value;
    
    // Try to parse as URL
    try {
      const url = new URL(input);
      // It's a valid URL, encode each component separately
      const encodedPathname = url.pathname
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
      const encodedSearch = url.search
        ? '?' + url.search.substring(1).split('&').map(param => {
            const idx = param.indexOf('=');
            if (idx === -1) {
              return encodeURIComponent(param);
            }
            const key = param.substring(0, idx);
            const value = param.substring(idx + 1);
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
          }).join('&')
        : '';
      const encodedHash = url.hash
        ? '#' + encodeURIComponent(url.hash.substring(1))
        : '';
      
      encodedData.value = `${url.protocol}//${url.host}${encodedPathname}${encodedSearch}${encodedHash}`;
    } catch (e) {
      // Not a valid URL, encode everything
      encodedData.value = encodeURIComponent(input);
    }
    
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
    const input = encodedData.value;
    
    // Try to parse as URL
    try {
      const url = new URL(input);
      // It's a valid URL, decode each component separately
      const decodedPathname = url.pathname
        .split('/')
        .map(segment => decodeURIComponent(segment))
        .join('/');
      const decodedSearch = url.search
        ? '?' + url.search.substring(1).split('&').map(param => {
            const idx = param.indexOf('=');
            if (idx === -1) {
              return decodeURIComponent(param);
            }
            const key = param.substring(0, idx);
            const value = param.substring(idx + 1);
            return `${decodeURIComponent(key)}=${decodeURIComponent(value)}`;
          }).join('&')
        : '';
      const decodedHash = url.hash
        ? '#' + decodeURIComponent(url.hash.substring(1))
        : '';
      
      rawData.value = `${url.protocol}//${url.host}${decodedPathname}${decodedSearch}${decodedHash}`;
    } catch (e) {
      // Not a valid URL, decode everything
      rawData.value = decodeURIComponent(input);
    }
    
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
