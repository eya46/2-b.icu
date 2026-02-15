<script setup lang="ts">

const rawData = ref("");
const encodedData = ref("");


const encodeUrl = () => {
  try {
    const input = rawData.value;
    // Check if input is a URL (starts with http:// or https://)
    const urlRegex = /^(https?:\/\/[^\/]+)(\/.*)?$/;
    const match = input.match(urlRegex);
    
    if (match) {
      // It's a URL, only encode the path part
      const baseUrl = match[1]; // protocol + domain
      const path = match[2] || ""; // path (including query and fragment)
      
      // Encode each segment of the path while preserving the structure
      if (path) {
        const encodedPath = path.split('/').map(segment => {
          // Don't encode query string separators and fragment identifiers
          if (segment.includes('?') || segment.includes('#')) {
            // Split by ? and # and encode each part separately
            return segment.split(/([?#])/).map((part, idx) => {
              // Keep ? and # as is
              if (part === '?' || part === '#') return part;
              // For query strings, encode keys and values but keep = and &
              if (idx > 0 && segment.includes('?')) {
                return part.split('&').map(param => {
                  const [key, value] = param.split('=');
                  return value !== undefined 
                    ? `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
                    : encodeURIComponent(key);
                }).join('&');
              }
              return encodeURIComponent(part);
            }).join('');
          }
          return encodeURIComponent(segment);
        }).join('/');
        encodedData.value = baseUrl + encodedPath;
      } else {
        encodedData.value = baseUrl;
      }
    } else {
      // Not a URL, encode everything
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
    // Check if input is a URL (starts with http:// or https://)
    const urlRegex = /^(https?:\/\/[^\/]+)(\/.*)?$/;
    const match = input.match(urlRegex);
    
    if (match) {
      // It's a URL, only decode the path part
      const baseUrl = match[1]; // protocol + domain
      const path = match[2] || ""; // path (including query and fragment)
      
      if (path) {
        rawData.value = baseUrl + decodeURIComponent(path);
      } else {
        rawData.value = baseUrl;
      }
    } else {
      // Not a URL, decode everything
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
