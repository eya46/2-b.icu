<script setup lang="ts">
const route = useRoute();

const navItems = [
  { path: "/", label: "首页" },
  { path: "/uuid", label: "UUID" },
  { path: "/base64", label: "Base64" },
  { path: "/imgbase64", label: "图片Base64" },
  { path: "/url", label: "URL编解码" },
  { path: "/qrcode", label: "QRCode" },
  { path: "/jwt", label: "JWT" },
  { path: "/bcrypt", label: "Bcrypt" },
  { path: "/mail-parser", label: "邮件解析" },
  { path: "/word-counter", label: "字数统计" },
  { path: "/color", label: "颜色工具" },
  { path: "/diff", label: "Diff" },
] as const;
</script>

<template>
  <el-container id="app" class="app-shell">
    <el-header class="app-header">
      <NuxtLink to="/" class="app-brand">
        2-b.icu
      </NuxtLink>

      <el-menu
        :key="route.path"
        class="app-nav"
        mode="horizontal"
        :default-active="route.path"
        router
      >
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>

      <a href="https://github.com/eya46/2-b.icu" target="_blank" class="github-link">
        <GitHubIcon />
        <span>2-b.icu</span>
      </a>
    </el-header>

    <el-main class="app-main">
      <div class="app-content">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </div>
    </el-main>
  </el-container>
</template>

<style>
html,
body {
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
#app {
  height: 100vh;
  overflow: hidden;
}

.app-shell {
  height: 100vh;
  background: var(--el-bg-color);
}

.app-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  height: 60px;
  flex-shrink: 0;
  background: var(--el-bg-color);
}

.app-main {
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 60px);
}

.app-main::-webkit-scrollbar {
  width: 8px;
}

.app-main::-webkit-scrollbar-track {
  background: transparent;
}

.app-main::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 4px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker);
}

.app-brand {
  flex: 0 0 auto;
  color: var(--el-text-color-primary);
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.app-nav {
  flex: 1 1 auto;
  border-bottom: 0;
  min-width: 0;
  background: transparent;
}

.app-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: var(--el-text-color-primary);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.github-link:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
