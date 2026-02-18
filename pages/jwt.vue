<script setup lang="ts">
const activeTab = ref("parse");

// 解析相关
const jwtInput = ref("");
const secretKey = ref("");
const secretIsBase64 = ref(false);
const header = ref("");
const payload = ref("");
const signature = ref("");
const expStatus = ref("");
const parseError = ref("");
const verifyStatus = ref<"valid" | "invalid" | "">("");
const verifyLoading = ref(false);
const algorithm = ref("");

// 生成相关
const genAlgorithm = ref("HS256");
const genSecret = ref("");
const genSecretIsBase64 = ref(false);
const genPayload = ref(`{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)}
}`);
const genResult = ref("");

const algorithmOptions = [
  { label: "HS256", value: "HS256" },
  { label: "HS384", value: "HS384" },
  { label: "HS512", value: "HS512" },
];

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  return atob(base64);
};

const stringToBase64Url = (str: string): string => {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const formatJson = (obj: object): string => {
  return JSON.stringify(obj, null, 2);
};

const getExpStatus = (payloadObj: Record<string, unknown>): string => {
  if (!payloadObj.exp) {
    return "";
  }
  const expTime = (payloadObj.exp as number) * 1000;
  const expDate = new Date(expTime);
  const now = Date.now();
  const isExpired = now > expTime;

  const formattedDate = expDate.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (isExpired) {
    return `已过期 (${formattedDate})`;
  } else {
    return `有效 (过期时间: ${formattedDate})`;
  }
};

const getHashAlgorithm = (alg: string): string | null => {
  const algMap: Record<string, string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
  };
  return algMap[alg] || null;
};

const getSecretKeyData = (secret: string, isBase64: boolean): Uint8Array => {
  if (isBase64) {
    try {
      const binary = atob(secret);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      return new TextEncoder().encode(secret);
    }
  }
  return new TextEncoder().encode(secret);
};

const parseJwt = () => {
  parseError.value = "";
  header.value = "";
  payload.value = "";
  signature.value = "";
  expStatus.value = "";
  verifyStatus.value = "";
  algorithm.value = "";

  const token = jwtInput.value.trim();
  if (!token) {
    parseError.value = "请输入 JWT Token";
    return;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    parseError.value = "无效的 JWT 格式，JWT 应包含三部分（Header.Payload.Signature）";
    return;
  }

  try {
    const headerJson = base64UrlDecode(parts[0]);
    const headerObj = JSON.parse(headerJson);
    header.value = formatJson(headerObj);
    algorithm.value = headerObj.alg || "";
  } catch {
    parseError.value = "Header 解析失败";
    return;
  }

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payloadObj = JSON.parse(payloadJson);
    payload.value = formatJson(payloadObj);
    expStatus.value = getExpStatus(payloadObj);
  } catch {
    parseError.value = "Payload 解析失败";
    return;
  }

  signature.value = parts[2];

  ElMessage.success("解析成功");
};

const clearParse = () => {
  jwtInput.value = "";
  secretKey.value = "";
  secretIsBase64.value = false;
  header.value = "";
  payload.value = "";
  signature.value = "";
  expStatus.value = "";
  parseError.value = "";
  verifyStatus.value = "";
  algorithm.value = "";
};

const verifySignature = async () => {
  if (!jwtInput.value.trim()) {
    ElMessage.warning("请先输入 JWT Token");
    return;
  }
  if (!secretKey.value) {
    ElMessage.warning("请输入密钥");
    return;
  }
  if (!algorithm.value) {
    ElMessage.warning("请先解析 JWT");
    return;
  }

  const hashAlg = getHashAlgorithm(algorithm.value);
  if (!hashAlg) {
    ElMessage.error(`不支持的算法: ${algorithm.value}，仅支持 HS256/HS384/HS512`);
    return;
  }

  verifyLoading.value = true;
  verifyStatus.value = "";

  try {
    const token = jwtInput.value.trim();
    const parts = token.split(".");
    const signInput = `${parts[0]}.${parts[1]}`;
    const signatureFromToken = parts[2];

    const keyData = getSecretKeyData(secretKey.value, secretIsBase64.value);
    const dataToSign = new TextEncoder().encode(signInput);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: hashAlg },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
    const computedSignature = arrayBufferToBase64Url(signatureBuffer);

    if (computedSignature === signatureFromToken) {
      verifyStatus.value = "valid";
      ElMessage.success("签名验证通过");
    } else {
      verifyStatus.value = "invalid";
      ElMessage.error("签名验证失败");
    }
  } catch {
    verifyStatus.value = "invalid";
    ElMessage.error("签名验证出错");
  } finally {
    verifyLoading.value = false;
  }
};

const generateJwt = async () => {
  if (!genSecret.value) {
    ElMessage.warning("请输入密钥");
    return;
  }

  let payloadObj: object;
  try {
    payloadObj = JSON.parse(genPayload.value);
  } catch {
    ElMessage.error("Payload JSON 格式错误");
    return;
  }

  try {
    const headerObj = { alg: genAlgorithm.value, typ: "JWT" };
    const headerB64 = stringToBase64Url(JSON.stringify(headerObj));
    const payloadB64 = stringToBase64Url(JSON.stringify(payloadObj));
    const signInput = `${headerB64}.${payloadB64}`;

    const hashAlg = getHashAlgorithm(genAlgorithm.value)!;
    const keyData = getSecretKeyData(genSecret.value, genSecretIsBase64.value);
    const dataToSign = new TextEncoder().encode(signInput);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: hashAlg },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, dataToSign);
    const signatureB64 = arrayBufferToBase64Url(signatureBuffer);

    genResult.value = `${signInput}.${signatureB64}`;
    ElMessage.success("JWT 生成成功");
  } catch {
    ElMessage.error("生成失败");
  }
};

const copyResult = async () => {
  if (!genResult.value) {
    ElMessage.warning("没有可复制的内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(genResult.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
};

const clearGenerate = () => {
  genAlgorithm.value = "HS256";
  genSecret.value = "";
  genSecretIsBase64.value = false;
  genPayload.value = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)}
}`;
  genResult.value = "";
};
</script>

<template>
  <div class="jwt-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="解析 JWT" name="parse">
        <div class="tab-content">
          <el-row :gutter="20">
            <el-col>
              <el-input
                v-model="jwtInput"
                type="textarea"
                :rows="4"
                placeholder="粘贴 JWT Token..."
              />
            </el-col>
          </el-row>

          <el-row :gutter="12" align="middle">
            <el-col :span="14">
              <el-input
                v-model="secretKey"
                placeholder="输入密钥（用于签名验证）"
                show-password
              />
            </el-col>
            <el-col :span="4">
              <el-checkbox v-model="secretIsBase64" label="Base64密钥" border />
            </el-col>
            <el-col :span="6">
              <el-button
                type="success"
                :loading="verifyLoading"
                @click="verifySignature"
                style="width: 100%"
              >
                验证签名
              </el-button>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col>
              <el-button type="primary" size="large" @click="parseJwt">
                解析 JWT
              </el-button>
              <el-button size="large" @click="clearParse">
                清空
              </el-button>
            </el-col>
          </el-row>

          <el-alert
            v-if="parseError"
            :title="parseError"
            type="error"
            show-icon
            :closable="false"
          />

          <template v-if="header && !parseError">
            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>Header</span>
                    </div>
                  </template>
                  <pre class="json-display">{{ header }}</pre>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>Payload</span>
                      <el-tag
                        v-if="expStatus"
                        :type="expStatus.startsWith('已过期') ? 'danger' : 'success'"
                        size="small"
                      >
                        {{ expStatus }}
                      </el-tag>
                    </div>
                  </template>
                  <pre class="json-display">{{ payload }}</pre>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>Signature</span>
                      <el-tag
                        v-if="verifyStatus === 'valid'"
                        type="success"
                        size="small"
                      >
                        签名有效
                      </el-tag>
                      <el-tag
                        v-else-if="verifyStatus === 'invalid'"
                        type="danger"
                        size="small"
                      >
                        签名无效
                      </el-tag>
                    </div>
                  </template>
                  <div class="signature-display">{{ signature }}</div>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="生成 JWT" name="generate">
        <div class="tab-content">
          <el-row :gutter="12" align="middle">
            <el-col :span="6">
              <el-select v-model="genAlgorithm" style="width: 100%">
                <el-option
                  v-for="opt in algorithmOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-col>
            <el-col :span="14">
              <el-input
                v-model="genSecret"
                placeholder="输入密钥"
                show-password
              />
            </el-col>
            <el-col :span="4">
              <el-checkbox v-model="genSecretIsBase64" label="Base64密钥" border />
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col>
              <el-input
                v-model="genPayload"
                type="textarea"
                :rows="8"
                placeholder="输入 Payload (JSON 格式)"
              />
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col>
              <el-button type="primary" size="large" @click="generateJwt">
                生成 JWT
              </el-button>
              <el-button size="large" @click="clearGenerate">
                清空
              </el-button>
            </el-col>
          </el-row>

          <template v-if="genResult">
            <el-row :gutter="20">
              <el-col>
                <el-card shadow="never">
                  <template #header>
                    <div class="card-header">
                      <span>生成结果</span>
                      <el-button type="primary" size="small" @click="copyResult">
                        复制
                      </el-button>
                    </div>
                  </template>
                  <div class="result-display">{{ genResult }}</div>
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
.jwt-container {
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

.json-display {
  margin: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.signature-display,
.result-display {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
}
</style>
