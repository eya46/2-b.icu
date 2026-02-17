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
        <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c.319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
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
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
#app {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  background: var(--el-bg-color);
}

.app-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  height: 56px;
  flex-shrink: 0;
  background: var(--el-bg-color);
}

.app-main {
  padding: 12px;
  padding-bottom: 40px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: calc(100vh - 56px);
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
  font-size: 16px;
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
  padding-bottom: 32px;
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

.github-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .app-header {
    padding: 0 16px;
    height: 60px;
  }

  .app-main {
    padding: 16px;
    padding-bottom: 48px;
    height: calc(100vh - 60px);
  }

  .app-brand {
    font-size: inherit;
  }
}
</style>
