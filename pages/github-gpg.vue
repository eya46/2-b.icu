<script setup lang="ts">
import type { GithubGpgKeyOption, GithubGpgLookupResponse } from "~/types/github-gpg";

useHead({
  title: "GitHub GPG 加密 - 2-b.icu",
});

const username = ref("");
const lookedUpUsername = ref("");
const keys = ref<GithubGpgKeyOption[]>([]);
const selectedFingerprint = ref("");
const plainText = ref("");
const encryptedText = ref("");
const queryLoading = ref(false);
const encryptLoading = ref(false);

const selectedKey = computed(() => {
  return keys.value.find((key) => key.fingerprint === selectedFingerprint.value) ?? null;
});

const getRequestErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error) {
    if ("data" in error) {
      const data = error.data as { statusMessage?: string; message?: string } | undefined;
      if (data?.statusMessage) {
        return data.statusMessage;
      }
      if (data?.message) {
        return data.message;
      }
    }

    if ("statusMessage" in error && typeof error.statusMessage === "string" && error.statusMessage) {
      return error.statusMessage;
    }

    if ("message" in error && typeof error.message === "string" && error.message) {
      return error.message;
    }
  }

  return fallback;
};

const getAlgorithmLabel = (key: GithubGpgKeyOption) => {
  if (key.curve) {
    return `${key.algorithm} / ${key.curve}`;
  }

  if (key.bits) {
    return `${key.algorithm} / ${key.bits} bit`;
  }

  return key.algorithm;
};

const formatFingerprint = (fingerprint: string) => {
  return fingerprint.toUpperCase().match(/.{1,4}/g)?.join(" ") ?? fingerprint.toUpperCase();
};

const formatDateTime = (value: string | null, emptyText = "未设置") => {
  if (!value) {
    return emptyText;
  }

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const resetLookupResult = () => {
  lookedUpUsername.value = "";
  keys.value = [];
  selectedFingerprint.value = "";
  encryptedText.value = "";
};

const clearAll = () => {
  username.value = "";
  plainText.value = "";
  resetLookupResult();
};

const queryKeys = async () => {
  const targetUsername = username.value.trim();
  if (!targetUsername) {
    ElMessage.warning("请输入 GitHub 用户名");
    return;
  }

  queryLoading.value = true;
  resetLookupResult();

  try {
    const response = await $fetch<GithubGpgLookupResponse>(`/api/github-gpg/${encodeURIComponent(targetUsername)}`);
    lookedUpUsername.value = response.username;
    keys.value = response.keys;
    selectedFingerprint.value = response.keys[0]?.fingerprint ?? "";

    if (response.keys.length > 0) {
      ElMessage.success(`找到 ${response.keys.length} 把可加密公钥`);
    } else {
      ElMessage.warning("该用户没有可用于加密的公开 GPG 公钥");
    }
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "查询失败"));
  } finally {
    queryLoading.value = false;
  }
};

const selectKey = (fingerprint: string) => {
  selectedFingerprint.value = fingerprint;
  encryptedText.value = "";
};

const encryptMessage = async () => {
  if (!selectedKey.value) {
    ElMessage.warning("请先选择一把 GPG 公钥");
    return;
  }

  if (plainText.value.length === 0) {
    ElMessage.warning("请输入要加密的明文");
    return;
  }

  encryptLoading.value = true;
  encryptedText.value = "";

  try {
    const openpgp = await import("openpgp");
    const publicKey = await openpgp.readKey({
      armoredKey: selectedKey.value.rawKey,
    });

    await publicKey.getEncryptionKey();

    encryptedText.value = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: plainText.value,
      }),
      encryptionKeys: publicKey,
      format: "armored",
    });

    ElMessage.success("密文生成成功");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "加密失败"));
  } finally {
    encryptLoading.value = false;
  }
};

const copyEncryptedText = async () => {
  if (!encryptedText.value) {
    ElMessage.warning("没有可复制的密文");
    return;
  }

  try {
    await navigator.clipboard.writeText(encryptedText.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};
</script>

<template>
  <div class="github-gpg-container">
    <div class="content-wrapper">
      <div>
        <h1 class="page-title">GitHub GPG 加密</h1>
        <div class="page-subtitle">
          输入 GitHub 用户名，选择公开的可加密公钥，并在浏览器中生成 PGP 密文。
        </div>
      </div>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">1. 查询公开公钥</span>
          </div>
        </template>

        <div class="card-stack">
          <el-row :gutter="12">
            <el-col :xs="24" :md="16">
              <el-input
                v-model="username"
                clearable
                placeholder="输入 GitHub 用户名，例如 torvalds"
                @keyup.enter="queryKeys"
              />
            </el-col>
            <el-col :xs="24" :md="8" class="button-row">
              <el-button
                type="primary"
                :loading="queryLoading"
                @click="queryKeys"
              >
                查询 GPG 公钥
              </el-button>
              <el-button :disabled="queryLoading" @click="clearAll">
                清空
              </el-button>
            </el-col>
          </el-row>

          <el-alert
            type="info"
            show-icon
            :closable="false"
            title="数据来自 GitHub 用户公开的 GPG keys，只展示当前可用于加密的公钥。"
          />
        </div>
      </el-card>

      <el-empty
        v-if="lookedUpUsername && keys.length === 0 && !queryLoading"
        description="该用户没有可用于加密的公开 GPG 公钥"
      />

      <template v-if="keys.length > 0">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">2. 选择公钥</span>
              <el-tag type="success" size="small">
                {{ lookedUpUsername }} / {{ keys.length }} 把可用公钥
              </el-tag>
            </div>
          </template>

          <div class="key-list">
            <button
              v-for="key in keys"
              :key="key.fingerprint"
              type="button"
              class="key-option"
              :class="{ 'is-selected': selectedFingerprint === key.fingerprint }"
              @click="selectKey(key.fingerprint)"
            >
              <div class="key-option-header">
                <div>
                  <div class="key-option-title">Key ID {{ key.keyId }}</div>
                  <div class="key-option-meta">
                    <span>{{ getAlgorithmLabel(key) }}</span>
                    <span>加密子钥 {{ key.encryptionKeyId }}</span>
                  </div>
                </div>
                <el-tag :type="selectedFingerprint === key.fingerprint ? 'primary' : 'info'" size="small">
                  {{ selectedFingerprint === key.fingerprint ? "已选中" : "点击选择" }}
                </el-tag>
              </div>

              <div class="fingerprint-text">{{ formatFingerprint(key.fingerprint) }}</div>

              <div class="uid-list">
                <span v-for="userId in key.userIds" :key="userId" class="uid-chip">
                  {{ userId }}
                </span>
              </div>
            </button>
          </div>
        </el-card>

        <el-card v-if="selectedKey" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">3. 生成密文</span>
              <el-tag type="warning" size="small">
                当前公钥 {{ selectedKey.keyId }}
              </el-tag>
            </div>
          </template>

          <div class="card-stack">
            <div class="selected-key-summary">
              <div class="summary-item">
                <div class="summary-label">指纹</div>
                <div class="summary-value monospace">{{ formatFingerprint(selectedKey.fingerprint) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">UID</div>
                <div class="summary-value">{{ selectedKey.primaryUserId || "无公开 UID" }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">创建时间</div>
                <div class="summary-value">{{ formatDateTime(selectedKey.createdAt) }}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">过期时间</div>
                <div class="summary-value">{{ formatDateTime(selectedKey.expiresAt, "未过期或未设置") }}</div>
              </div>
            </div>

            <el-input
              v-model="plainText"
              type="textarea"
              :rows="8"
              placeholder="输入要加密的明文..."
              class="code-textarea"
            />

            <div class="button-row">
              <el-button
                type="primary"
                :loading="encryptLoading"
                @click="encryptMessage"
              >
                生成加密密文
              </el-button>
              <el-button :disabled="encryptLoading" @click="plainText = ''">
                清空明文
              </el-button>
            </div>
          </div>
        </el-card>
      </template>

      <el-card v-if="encryptedText" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">4. PGP 密文</span>
            <el-button type="primary" size="small" @click="copyEncryptedText">
              复制
            </el-button>
          </div>
        </template>

        <el-input
          :model-value="encryptedText"
          type="textarea"
          :rows="12"
          readonly
          class="code-textarea"
        />
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.github-gpg-container {
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
}

.page-subtitle {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.card-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.key-list {
  display: grid;
  gap: 12px;
}

.key-option {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.key-option:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.key-option.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
}

.key-option-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.key-option-title {
  font-weight: 700;
  font-size: 15px;
}

.key-option-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.fingerprint-text {
  margin-top: 12px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.uid-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.uid-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}

.selected-key-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-item {
  padding: 14px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  margin-top: 6px;
  line-height: 1.6;
  word-break: break-word;
}

.monospace {
  font-family: monospace;
}

.code-textarea :deep(.el-textarea__inner) {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.7;
  border-radius: 6px;
}

@media (max-width: 767px) {
  .card-header,
  .key-option-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .selected-key-summary {
    grid-template-columns: 1fr;
  }
}
</style>
