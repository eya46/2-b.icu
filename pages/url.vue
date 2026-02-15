<script setup lang="ts">

const rawData = ref("");
const encodedData = ref("");


const encodeUrl = () => {
  try {
    const input = rawData.value;
    
    // Check if input looks like a URL (starts with http:// or https://)
    const urlMatch = input.match(/^(https?:\/\/[^/]+)(\/.*)?$/);
    
    if (urlMatch) {
      // It's a URL, only encode the path part
      const baseUrl = urlMatch[1]; // protocol + domain
      const pathPart = urlMatch[2] || ''; // everything after domain
      
      if (pathPart) {
        // Split by / and encode each segment
        const segments = pathPart.split('/');
        const encodedPath = segments.map((segment, idx) => {
          if (idx === 0) return ''; // First element is empty before leading /
          
          // Handle query string
          if (segment.includes('?')) {
            const [path, query] = segment.split('?');
            const encodedPathSeg = encodeURIComponent(path);
            const encodedQuery = query.split('&').map(param => {
              const eqIdx = param.indexOf('=');
              if (eqIdx === -1) {
                return encodeURIComponent(param);
              }
              const key = param.substring(0, eqIdx);
              const value = param.substring(eqIdx + 1);
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }).join('&');
            return `${encodedPathSeg}?${encodedQuery}`;
          }
          
          // Handle fragment
          if (segment.includes('#')) {
            const [path, hash] = segment.split('#');
            return `${encodeURIComponent(path)}#${encodeURIComponent(hash)}`;
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
    
    // Check if input looks like a URL (starts with http:// or https://)
    const urlMatch = input.match(/^(https?:\/\/[^/]+)(\/.*)?$/);
    
    if (urlMatch) {
      // It's a URL, only decode the path part
      const baseUrl = urlMatch[1]; // protocol + domain
      const pathPart = urlMatch[2] || ''; // everything after domain
      
      if (pathPart) {
        // Split by / and decode each segment
        const segments = pathPart.split('/');
        const decodedPath = segments.map((segment, idx) => {
          if (idx === 0) return ''; // First element is empty before leading /
          
          // Handle query string
          if (segment.includes('?')) {
            const [path, query] = segment.split('?');
            const decodedPathSeg = decodeURIComponent(path);
            const decodedQuery = query.split('&').map(param => {
              const eqIdx = param.indexOf('=');
              if (eqIdx === -1) {
                return decodeURIComponent(param);
              }
              const key = param.substring(0, eqIdx);
              const value = param.substring(eqIdx + 1);
              return `${decodeURIComponent(key)}=${decodeURIComponent(value)}`;
            }).join('&');
            return `${decodedPathSeg}?${decodedQuery}`;
          }
          
          // Handle fragment
          if (segment.includes('#')) {
            const [path, hash] = segment.split('#');
            return `${decodeURIComponent(path)}#${decodeURIComponent(hash)}`;
          }
          
          return decodeURIComponent(segment);
        }).join('/');
        
        rawData.value = baseUrl + decodedPath;
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
