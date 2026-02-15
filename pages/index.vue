<template>
  <el-space direction="vertical" alignment="flex-start" :size="16" class="home">
    <div>
      <h1 class="home-title">工具箱</h1>
      <div class="home-subtitle">选择一个功能开始使用</div>
    </div>

    <el-row :gutter="16" class="home-grid">
      <el-col v-for="item in items" :key="item.path" :xs="24" :sm="12" :md="8">
        <NuxtLink :to="item.path" class="home-link">
          <el-card shadow="hover">
            <div class="home-card-title">{{ item.title }}</div>
            <div class="home-card-desc">{{ item.desc }}</div>
          </el-card>
        </NuxtLink>
      </el-col>
    </el-row>
  </el-space>
</template>

<script setup lang="ts">
const items = [
  { path: "/uuid", title: "UUID", desc: "批量生成 UUID（v4）" },
  { path: "/base64", title: "Base64", desc: "文本 Base64 编码 / 解码" },
  { path: "/imgbase64", title: "图片Base64", desc: "图片与 Base64 互转（支持 data:* 前缀）" },
  { path: "/url", title: "URL编解码", desc: "URL 编码 / 解码" },
  { path: "/qrcode", title: "QRCode", desc: "生成二维码并自定义参数" },
  { path: "/jwt", title: "JWT", desc: "解析 / 生成 JWT Token" },
  { path: "/mail-parser", title: "邮件解析", desc: "解析 .eml/MIME 邮件内容" },
  { path: "/word-counter", title: "字数统计", desc: "统计文本字符、单词、行数等" },
  { path: "/color", title: "颜色工具", desc: "取色器与颜色格式转换" },
  { path: "/diff", title: "Diff", desc: "文本差异对比工具" },
] as const;
</script>

<style scoped>
.home-grid {
  row-gap: 16px;
}

.home-title {
  margin: 0;
  font-size: 24px;
}

.home-subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.home-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.home-card-title {
  font-weight: 700;
}

.home-card-desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.4;
}
</style>
