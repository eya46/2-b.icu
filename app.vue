<script setup lang="ts">
const route = useRoute();

const navItems = [
  { path: "/", label: "首页" },
  { path: "/uuid", label: "UUID" },
  { path: "/base64", label: "Base64" },
  { path: "/imgbase64", label: "图片Base64" },
  { path: "/qrcode", label: "QRCode" },
  { path: "/mail-parser", label: "邮件解析" },
] as const;
</script>

<template>
  <el-container id="app" class="app-shell">
    <el-header class="app-header">
      <NuxtLink to="/" class="app-brand">
        2-b.icu
      </NuxtLink>

      <el-menu class="app-nav" mode="horizontal" :default-active="route.path" router>
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          {{ item.label }}
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="app-main">
      <div class="app-content">
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
#app {
  min-height: 100vh;
}

.app-shell {
  background: var(--el-bg-color);
}

.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--el-bg-color);
}

.app-main {
  padding: 16px;
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
</style>
