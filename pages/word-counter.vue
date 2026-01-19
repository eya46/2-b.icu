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
    <el-input
      v-model="text"
      type="textarea"
      :rows="10"
      placeholder="请输入或粘贴文本..."
      class="text-input"
    />

    <el-divider />

    <el-row :gutter="16">
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">总字符数</div>
          <div class="stat-value">{{ countResult.chars }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">不含空格</div>
          <div class="stat-value">{{ countResult.charsNoSpace }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">单词数</div>
          <div class="stat-value">{{ countResult.words }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">行数</div>
          <div class="stat-value">{{ countResult.lines }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">段落数</div>
          <div class="stat-value">{{ countResult.paragraphs }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">中文字符</div>
          <div class="stat-value">{{ countResult.cjkChars }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">英文字符</div>
          <div class="stat-value">{{ countResult.englishChars }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">数字个数</div>
          <div class="stat-value">{{ countResult.numbers }}</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-item">
          <div class="stat-label">标点符号</div>
          <div class="stat-value">{{ countResult.punctuation }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.counter-container {
  padding: 20px;
}

.text-input {
  font-size: 16px;
}

.stat-item {
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 0;
  text-align: center;
  transition: background-color 0.3s;
}

.stat-item:hover {
  background-color: var(--el-fill-color);
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
}
</style>
