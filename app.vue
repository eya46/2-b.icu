<template>
  <el-container id="main">
    <el-header>芝士Header</el-header>
    <el-main>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </el-main>
    <el-footer>芝士Footer</el-footer>
  </el-container>
</template>
<script setup lang="ts">
</script>
<style scoped>
.el-container {
  height: 100vh;
}
</style>
