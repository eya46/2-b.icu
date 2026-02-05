<script setup lang="ts">
import { bundledLanguages } from 'shiki'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

interface DiffLine {
  type: 'same' | 'add' | 'delete' | 'modify'
  leftLine: string
  rightLine: string
  leftNum: number
  rightNum: number
  leftHtml?: string
  rightHtml?: string
}

const textA = ref('')
const textB = ref('')
const diffResult = ref<DiffLine[]>([])
const enableHighlight = ref(false)
const selectedLanguage = ref('text')

// 差异导航相关
const currentDiffIndex = ref(0)
const diffIndices = computed(() => {
  return diffResult.value
    .map((line, index) => ({ index, type: line.type }))
    .filter(item => item.type !== 'same')
})
const totalDiffs = computed(() => diffIndices.value.length)
const currentDiffIndexInfo = computed(() => {
  if (totalDiffs.value === 0) return null
  return {
    current: currentDiffIndex.value + 1,
    total: totalDiffs.value,
  }
})

// 获取当前差异的行索引
const currentLineIndex = computed(() => {
  if (totalDiffs.value === 0) return -1
  return diffIndices.value[currentDiffIndex.value]?.index ?? -1
})

function goToPrevDiff() {
  if (currentDiffIndex.value > 0) {
    currentDiffIndex.value--
    scrollToCurrentDiff()
  }
}

function goToNextDiff() {
  if (currentDiffIndex.value < totalDiffs.value - 1) {
    currentDiffIndex.value++
    scrollToCurrentDiff()
  }
}

function scrollToCurrentDiff() {
  nextTick(() => {
    const element = document.getElementById(`diff-row-${currentLineIndex.value}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

// 获取所有可用语言并排序
const availableLanguages = computed(() => {
  const langs = Object.keys(bundledLanguages).sort()
  // 将常用语言提前
  const commonLangs = ['text', 'javascript', 'typescript', 'json', 'python', 'css', 'html', 'vue', 'markdown']
  const otherLangs = langs.filter(lang => !commonLangs.includes(lang))
  return [...commonLangs, ...otherLangs]
})

// 创建 highlighter 实例（全局缓存）
let highlighter: any = null
const loadedLanguages = new Set<string>()

async function initHighlighter() {
  if (highlighter) return

  const { createHighlighter } = await import('shiki')
  highlighter = await createHighlighter({
    themes: ['vitesse-light'],
    langs: ['text'],
  })
  loadedLanguages.add('text')
}

// 高亮代码
async function highlightCode(code: string, lang: string): Promise<string> {
  if (!enableHighlight.value || !highlighter || !code) return code

  try {
    // 检查语言是否已加载
    if (!loadedLanguages.has(lang)) {
      await highlighter.loadLanguage(lang)
      loadedLanguages.add(lang)
    }

    return highlighter.codeToHtml(code, {
      lang,
      theme: 'vitesse-light',
    })
  } catch {
    // 如果高亮失败，返回原始代码
    return code
  }
}

// LCS (Longest Common Subsequence) 算法实现
function computeLCS(arr1: string[], arr2: string[]): number[][] {
  const m = arr1.length
  const n = arr2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

function backtrace(arr1: string[], arr2: string[], dp: number[][]): DiffLine[] {
  let i = arr1.length
  let j = arr2.length
  const result: DiffLine[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
      result.unshift({
        type: 'same',
        leftLine: arr1[i - 1],
        rightLine: arr2[j - 1],
        leftNum: i,
        rightNum: j,
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'add',
        leftLine: '',
        rightLine: arr2[j - 1],
        leftNum: -1,
        rightNum: j,
      })
      j--
    } else if (i > 0) {
      result.unshift({
        type: 'delete',
        leftLine: arr1[i - 1],
        rightLine: '',
        leftNum: i,
        rightNum: -1,
      })
      i--
    }
  }

  return result
}

async function computeDiff(): Promise<void> {
  const linesA = textA.value.split('\n')
  const linesB = textB.value.split('\n')

  // 检测修改行
  const dp = computeLCS(linesA, linesB)
  const result = backtrace(linesA, linesB, dp)

  // 后处理：将相邻的 delete 和 add 合并为 modify
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].type === 'delete' && result[i + 1].type === 'add') {
      result[i].type = 'modify'
      result[i].rightLine = result[i + 1].rightLine
      result[i].rightNum = result[i + 1].rightNum
      result.splice(i + 1, 1)
      i--
    }
  }

  // 如果启用了高亮，对每行进行高亮
  if (enableHighlight.value && highlighter) {
    const lang = selectedLanguage.value
    for (const line of result) {
      if (line.leftLine) {
        line.leftHtml = await highlightCode(line.leftLine, lang)
      }
      if (line.rightLine) {
        line.rightHtml = await highlightCode(line.rightLine, lang)
      }
    }
  }

  diffResult.value = result
}

// 实时监听文本变化
watch([textA, textB, enableHighlight, selectedLanguage], () => {
  currentDiffIndex.value = 0
  computeDiff()
}, { deep: true })

// 监听高亮开关，初始化 highlighter
watch(enableHighlight, async (enabled) => {
  if (enabled) {
    await initHighlighter()
  }
})

// 初始化计算
onMounted(() => {
  computeDiff()
})
</script>

<template>
  <div class="diff-page">
    <el-card class="diff-card">
      <template #header>
        <div class="card-header">
          <span>文本差异对比</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :span="12">
          <div class="input-section">
            <div class="section-title">左侧</div>
            <el-input
              v-model="textA"
              type="textarea"
              :rows="15"
              placeholder="输入或粘贴文本..."
              class="diff-input"
            />
          </div>
        </el-col>

        <el-col :span="12">
          <div class="input-section">
            <div class="section-title">右侧</div>
            <el-input
              v-model="textB"
              type="textarea"
              :rows="15"
              placeholder="输入或粘贴文本..."
              class="diff-input"
            />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="diff-card">
      <template #header>
        <div class="card-header">
          <span>差异结果</span>
          <div class="header-controls">
            <el-select
              v-model="selectedLanguage"
              placeholder="选择语言"
              class="lang-select"
              :disabled="!enableHighlight"
              filterable
            >
              <el-option
                v-for="lang in availableLanguages"
                :key="lang"
                :label="lang"
                :value="lang"
              />
            </el-select>
            <el-switch
              v-model="enableHighlight"
              active-text="代码高亮"
              class="highlight-switch"
            />
          </div>
        </div>
      </template>

      <div class="diff-result" v-if="diffResult.length > 0 || textA || textB">
        <div class="diff-row-header">
          <div class="diff-col-left">
            <span class="diff-col-title">行号</span>
            <span class="diff-col-title">左侧</span>
          </div>
          <div class="diff-col-right">
            <span class="diff-col-title">行号</span>
            <span class="diff-col-title">右侧</span>
          </div>
        </div>

        <div
          v-for="(line, index) in diffResult"
          :key="index"
          :id="`diff-row-${index}`"
          :class="['diff-row', `diff-${line.type}`, index === currentLineIndex && line.type !== 'same' ? 'current-diff' : '']"
        >
          <div class="diff-col-left">
            <span class="line-num">{{ line.leftNum !== -1 ? line.leftNum : '' }}</span>
            <span
              class="line-content"
              v-if="enableHighlight && line.leftHtml"
              v-html="line.leftHtml"
            />
            <span class="line-content" v-else>{{ line.leftLine }}</span>
          </div>
          <div class="diff-col-right">
            <span class="line-num">{{ line.rightNum !== -1 ? line.rightNum : '' }}</span>
            <span
              class="line-content"
              v-if="enableHighlight && line.rightHtml"
              v-html="line.rightHtml"
            />
            <span class="line-content" v-else>{{ line.rightLine }}</span>
          </div>
        </div>
      </div>

      <el-empty v-else description="在上方输入文本后显示差异对比结果" />
    </el-card>

    <!-- 差异导航悬浮窗 -->
    <div v-if="totalDiffs > 0" class="diff-navigator">
      <div class="navigator-content">
        <span class="navigator-info">
          {{ currentDiffIndexInfo?.current }} / {{ currentDiffIndexInfo?.total }}
        </span>
        <div class="navigator-buttons">
          <el-button
            :disabled="currentDiffIndex <= 0"
            @click="goToPrevDiff"
            size="small"
            :icon="ArrowLeft"
          />
          <el-button
            :disabled="currentDiffIndex >= totalDiffs - 1"
            @click="goToNextDiff"
            size="small"
            :icon="ArrowRight"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diff-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-select {
  width: 150px;
}

.highlight-switch {
  --el-switch-on-text-color: var(--el-color-primary);
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.section-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.diff-input {
  font-family: 'Courier New', Consolas, monospace;
}

.diff-input :deep(textarea) {
  font-family: inherit;
}

.diff-result {
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', Consolas, monospace;
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow-x: auto;
  max-width: 100%;
}

.diff-row-header {
  display: flex;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.diff-col-left,
.diff-col-right {
  flex: 1;
  min-width: 0;
  display: flex;
  padding: 8px;
  gap: 16px;
  border-right: 1px solid var(--el-border-color-light);
}

.diff-col-right {
  border-right: none;
}

.diff-col-title {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.diff-col-title:nth-child(1) {
  min-width: 48px;
}

.diff-row {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.diff-row .diff-col-left,
.diff-row .diff-col-right {
  padding: 4px 8px;
  background: transparent;
  min-width: 0;
  flex: 1;
}

.line-num {
  flex-shrink: 0;
  min-width: 48px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  user-select: none;
  text-align: right;
  padding-right: 8px;
}

.line-content {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
  color: var(--el-text-color-primary);
}

/* Shiki code highlighting styles */
.line-content :deep(pre) {
  margin: 0;
  padding: 0;
  background: transparent;
  display: inline;
}

.line-content :deep(code) {
  font-family: inherit;
  font-size: inherit;
  background: transparent;
  padding: 0;
}

/* 差异类型样式 */
.diff-same {
  background: transparent;
}

.diff-delete {
  background: rgba(245, 108, 108, 0.1);
}

.diff-add {
  background: rgba(103, 194, 58, 0.1);
}

.diff-modify {
  background: rgba(230, 162, 60, 0.1);
}

/* 当前高亮的差异行 */
.current-diff {
  background: rgba(64, 158, 255, 0.15) !important;
  position: relative;
}

.current-diff::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--el-color-primary);
}

/* 差异导航悬浮窗 */
.diff-navigator {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.navigator-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navigator-info {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.navigator-buttons {
  display: flex;
  gap: 8px;
}
</style>
