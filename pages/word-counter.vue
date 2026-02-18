<script setup lang="ts">
interface CountResult {
  chars: number;
  charsNoSpace: number;
  words: number;
  lines: number;
  paragraphs: number;
  cjkChars: number;
  englishChars: number;
  numbers: number;
  punctuation: number;
}

const text = ref("");
const countResult = ref<CountResult>({
  chars: 0,
  charsNoSpace: 0,
  words: 0,
  lines: 0,
  paragraphs: 0,
  cjkChars: 0,
  englishChars: 0,
  numbers: 0,
  punctuation: 0,
});

const count = () => {
  const str = text.value;

  // 总字符数
  const chars = str.length;

  // 不含空格的字符数
  const charsNoSpace = str.replace(/\s/g, "").length;

  // 单词数（支持中英文）
  const words = countWords(str);

  // 行数
  const lines = str.length > 0 ? str.split(/\r\n|\r|\n/).length : 0;

  // 段落数
  const paragraphs = str.trim().length > 0
    ? str.trim().split(/\r\n\r\n|\r\r|\n\n/).length
    : 0;

  // 中文字符数
  const cjkChars = (str.match(/[\u4e00-\u9fa5]/g) || []).length;

  // 英文字符数
  const englishChars = (str.match(/[a-zA-Z]/g) || []).length;

  // 数字个数
  const numbers = (str.match(/[0-9]/g) || []).length;

  // 标点符号
  const punctuation = (str.match(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~，。！？、；：""''「」【】]/g) || []).length;

  countResult.value = {
    chars,
    charsNoSpace,
    words,
    lines,
    paragraphs,
    cjkChars,
    englishChars,
    numbers,
    punctuation,
  };
};

function countWords(str: string): number {
  // 分离中文和英文
  const cjkWords = (str.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 英文单词（按空格分割）
  const englishWords = str
    .replace(/[\u4e00-\u9fa5]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return cjkWords + englishWords;
}

// 监听文本变化实时统计
watch(text, () => {
  count();
});
</script>

<template>
  <div class="counter-container">
    <div class="content-wrapper">
      <el-card shadow="never" class="input-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">输入文本</span>
            <span class="card-count" v-if="text.length > 0">{{ text.length }} 字符</span>
          </div>
        </template>
        <el-input
          v-model="text"
          type="textarea"
          :rows="10"
          placeholder="请输入或粘贴文本..."
          class="text-input"
        />
      </el-card>

      <el-row :gutter="12">
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">总字符数</div>
            <div class="stat-value">{{ countResult.chars }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">不含空格</div>
            <div class="stat-value">{{ countResult.charsNoSpace }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">单词数</div>
            <div class="stat-value">{{ countResult.words }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">行数</div>
            <div class="stat-value">{{ countResult.lines }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">段落数</div>
            <div class="stat-value">{{ countResult.paragraphs }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">中文字符</div>
            <div class="stat-value">{{ countResult.cjkChars }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">英文字符</div>
            <div class="stat-value">{{ countResult.englishChars }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-item">
            <div class="stat-label">数字个数</div>
            <div class="stat-value">{{ countResult.numbers }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="stat-item">
            <div class="stat-label">标点符号</div>
            <div class="stat-value">{{ countResult.punctuation }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.counter-container {
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.input-card {
  margin-top: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.card-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.text-input :deep(.el-textarea__inner) {
  font-size: 15px;
  line-height: 1.8;
  border-radius: 6px;
}

.stat-item {
  padding: 18px 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
  margin-top: 12px;
}

.stat-item:hover {
  background-color: var(--el-fill-color);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}
</style>
