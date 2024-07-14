// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@element-plus/nuxt"],
  app: {
    head: {
      bodyAttrs: {
        style: "height: 100vh; margin:0; padding: 0;",
      },
    },
  },
});
