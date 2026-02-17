<script setup lang="ts">
import bcrypt from "bcryptjs";

const activeTab = ref("hash");
const saltRounds = ref(10);

// Hash
const plainText = ref("");
const hashResult = ref("");
const hashLoading = ref(false);

// Verify
const verifyText = ref("");
const verifyHash = ref("");
const verifyResult = ref<"valid" | "invalid" | "">("");
const verifyLoading = ref(false);

const hashPassword = async () => {
  if (!plainText.value) {
    ElMessage.warning("请输入要哈希的文本");
    return;
  }

  hashResult.value = "";
  hashLoading.value = true;

  try {
    hashResult.value = await new Promise((resolve, reject) => {
      bcrypt.hash(plainText.value, saltRounds.value, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
    ElMessage.success("哈希生成成功");
  } catch {
    ElMessage.error("哈希生成失败");
  } finally {
    hashLoading.value = false;
  }
};

const clearHash = () => {
  plainText.value = "";
  saltRounds.value = 10;
  hashResult.value = "";
};

const verifyPassword = async () => {
  if (!verifyText.value) {
    ElMessage.warning("请输入要验证的文本");
    return;
  }
  if (!verifyHash.value) {
    ElMessage.warning("请输入要验证的哈希");
    return;
  }

  verifyResult.value = "";
  verifyLoading.value = true;

  try {
    const valid = await new Promise((resolve, reject) => {
      bcrypt.compare(verifyText.value, verifyHash.value, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    verifyResult.value = valid ? "valid" : "invalid";
    if (valid) {
      ElMessage.success("验证通过");
    } else {
      ElMessage.error("验证失败");
    }
  } catch {
    ElMessage.error("验证出错");
    verifyResult.value = "";
  } finally {
    verifyLoading.value = false;
  }
};

const clearVerify = () => {
  verifyText.value = "";
  verifyHash.value = "";
  verifyResult.value = "";
};

const copyHash = async () => {
  if (!hashResult.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(hashResult.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};
</script>

<template>
  <div class="bcrypt-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="生成哈希" name="hash">
        <div class="tab-content">
          <el-row :gutter="20">
            <el-col>
              <el-input
                v-model="plainText"
                type="textarea"
                :rows="4"
                placeholder="输入要哈希的文本..."
              />
            </el-col>
          </el-row>

          <el-row :gutter="12" align="middle">
            <el-col :span="8">
              <el-input-number
                v-model="saltRounds"
                :min="4"
                :max="20"
                label="盐轮数"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="16">
              <el-button
                type="primary"
                size="large"
                :loading="hashLoading"
                @click="hashPassword"
              >
                生成哈希
              </el-button>
              <el-button size="large" @click="clearHash" :disabled="hashLoading">
                清空
              </el-button>
            </el-col>
          </el-row>

          <template v-if="hashResult">
            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>哈希结果</span>
                      <el-button type="primary" size="small" @click="copyHash">
                        复制
                      </el-button>
                    </div>
                  </template>
                  <div class="result-display">{{ hashResult }}</div>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="验证哈希" name="verify">
        <div class="tab-content">
          <el-row :gutter="20">
            <el-col>
              <el-input
                v-model="verifyText"
                type="textarea"
                :rows="3"
                placeholder="输入要验证的文本..."
              />
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col>
              <el-input
                v-model="verifyHash"
                type="textarea"
                :rows="3"
                placeholder="输入要验证的哈希..."
              />
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col>
              <el-button
                type="primary"
                size="large"
                :loading="verifyLoading"
                @click="verifyPassword"
              >
                验证
              </el-button>
              <el-button size="large" @click="clearVerify" :disabled="verifyLoading">
                清空
              </el-button>
            </el-col>
          </el-row>

          <template v-if="verifyResult">
            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>验证结果</span>
                      <el-tag
                        v-if="verifyResult === 'valid'"
                        type="success"
                        size="small"
                      >
                        匹配
                      </el-tag>
                      <el-tag
                        v-else-if="verifyResult === 'invalid'"
                        type="danger"
                        size="small"
                      >
                        不匹配
                      </el-tag>
                    </div>
                  </template>
                  <div class="result-display">
                    {{ verifyResult === "valid" ? "文本与哈希匹配" : "文本与哈希不匹配" }}
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.bcrypt-container {
  display: flex;
  flex-direction: column;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.el-col {
  margin: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-display {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
}
</style>
