<script setup lang="ts">
import { ref, markRaw, computed, onMounted } from 'vue'
import { 
  Operation, 
  Link, 
  DocumentCopy, 
  Timer, 
  Search,
  Menu as IconMenu,
  Back,
  ArrowRight,
  EditPen,
  DataAnalysis,
  Money,
  Odometer,
  Key,
  Picture,
  Monitor,
  Notebook,
  Refresh,
  Switch,
  Connection,
  VideoPlay,
  ScaleToOriginal,
  MagicStick,
  Lock
} from '@element-plus/icons-vue'
import JsonFormatter from '../components/tools/JsonFormatter.vue'
import UrlConverter from '../components/tools/UrlConverter.vue'
import Base64Converter from '../components/tools/Base64Converter.vue'
import TimestampConverter from '../components/tools/TimestampConverter.vue'
import NameConverter from '../components/tools/NameConverter.vue'
import WordCount from '../components/tools/WordCount.vue'
import CronGenerator from '../components/tools/CronGenerator.vue'
import AmountConverter from '../components/tools/AmountConverter.vue'
import Stopwatch from '../components/tools/Stopwatch.vue'
import IdGenerator from '../components/tools/IdGenerator.vue'
import ImageCompressor from '../components/tools/ImageCompressor.vue'
import CodeRunner from '../components/tools/CodeRunner.vue'
import MarkdownEditor from '../components/tools/MarkdownEditor.vue'
import DevCheatsheet from '../components/tools/DevCheatsheet.vue'
import JsonToJava from '../components/tools/JsonToJava.vue'
import RegexTester from '../components/tools/RegexTester.vue'
import PropYamlConverter from '../components/tools/PropYamlConverter.vue'
import EncodingConverter from '../components/tools/EncodingConverter.vue'
import SpringBootBuilder from '../components/tools/SpringBootBuilder.vue'
import CssUnitConverter from '../components/tools/CssUnitConverter.vue'
import ColorConverter from '../components/tools/ColorConverter.vue'
import MockGenerator from '../components/tools/MockGenerator.vue'
import NginxValidator from '../components/tools/NginxValidator.vue'
import HashGenerator from '../components/tools/HashGenerator.vue'

// Define Tool Interface
interface Tool {
  id: string
  name: string
  icon: any
  component: any
  desc: string
  category: string
}

// Tool Definitions
const tools: Tool[] = [
  { 
    id: 'img-compress', 
    name: '图片压缩', 
    icon: Picture, 
    component: markRaw(ImageCompressor), 
    desc: '本地图片压缩，支持 JPG/PNG',
    category: '多媒体'
  },
  { 
    id: 'id-gen', 
    name: 'ID/密钥生成器', 
    icon: Key, 
    component: markRaw(IdGenerator), 
    desc: 'UUID、Snowflake ID、RSA/ECC 密钥对',
    category: '开发'
  },
  { 
    id: 'code-runner', 
    name: '在线代码运行', 
    icon: Monitor, 
    component: markRaw(CodeRunner), 
    desc: '支持 Java, JS, Python 等多语言在线运行',
    category: '开发'
  },
  { 
    id: 'stopwatch', 
    name: '在线秒表', 
    icon: Odometer, 
    component: markRaw(Stopwatch), 
    desc: '毫秒级秒表，支持计次与快捷键',
    category: '常用'
  },
  { 
    id: 'amount', 
    name: '金额转大写', 
    icon: Money, 
    component: markRaw(AmountConverter), 
    desc: '人民币数字金额转中文大写',
    category: '金融'
  },
  { 
    id: 'cron', 
    name: 'Cron 生成器', 
    icon: Timer, 
    component: markRaw(CronGenerator), 
    desc: '可视化 Cron 表达式生成与解析',
    category: '开发'
  },
  { 
    id: 'wordcount', 
    name: '字数统计', 
    icon: DataAnalysis, 
    component: markRaw(WordCount), 
    desc: '汉字、英文、字符、行数实时统计',
    category: '文本'
  },
  { 
    id: 'name', 
    name: '命名转换', 
    icon: EditPen, 
    component: markRaw(NameConverter), 
    desc: '驼峰、下划线、常量等命名风格互转',
    category: '开发'
  },
  { 
    id: 'json', 
    name: 'JSON 工具', 
    icon: Operation, 
    component: markRaw(JsonFormatter), 
    desc: 'JSON 格式化、压缩、校验',
    category: '开发'
  },
  { 
    id: 'url', 
    name: 'URL 编解码', 
    icon: Link, 
    component: markRaw(UrlConverter), 
    desc: 'URL 字符串编码与解码',
    category: '转换'
  },
  { 
    id: 'base64', 
    name: 'Base64 转换', 
    icon: DocumentCopy, 
    component: markRaw(Base64Converter), 
    desc: 'Base64 数据编码与解码',
    category: '加密'
  },
  { 
    id: 'timestamp', 
    name: '时间戳转换', 
    icon: Timer, 
    component: markRaw(TimestampConverter), 
    desc: 'Unix 时间戳与日期互转',
    category: '常用'
  },
  { 
    id: 'markdown', 
    name: 'Markdown 编辑器', 
    icon: Notebook, 
    component: markRaw(MarkdownEditor), 
    desc: '实时预览、语法高亮、支持导出 Markdown/HTML',
    category: '文本'
  },
  {
    id: 'cheatsheet',
    name: '开发速查表',
    icon: Notebook,
    component: markRaw(DevCheatsheet),
    desc: 'XML 转义、MIME 类型、SQL 语法、Linux/PS 命令集锦',
    category: '开发'
  },
  {
    id: 'json-to-java',
    name: 'JSON 转 Java',
    icon: Refresh,
    component: markRaw(JsonToJava),
    desc: 'JSON 结构自动生成 Java Bean 类',
    category: '开发'
  },
  {
    id: 'regex',
    name: '正则测试',
    icon: Search,
    component: markRaw(RegexTester),
    desc: '正则表达式实时测试与高亮显示',
    category: '开发'
  },
  {
    id: 'prop-yaml',
    name: 'Props / YAML',
    icon: Switch,
    component: markRaw(PropYamlConverter),
    desc: 'Properties 与 YAML 配置文件互转',
    category: '开发'
  },
  {
    id: 'encoding',
    name: '编码转换',
    icon: Connection,
    component: markRaw(EncodingConverter),
    desc: 'UTF-8/GBK/ISO-8859-1 互转与乱码恢复',
    category: '转换'
  },
  {
    id: 'springboot-builder',
    name: 'Spring Boot 启动器',
    icon: VideoPlay,
    component: markRaw(SpringBootBuilder),
    desc: '生成 Spring Boot Jar 启动命令与 JVM 参数',
    category: '开发'
  },
  {
    id: 'css-unit',
    name: 'CSS 单位转换',
    icon: ScaleToOriginal,
    component: markRaw(CssUnitConverter),
    desc: 'px ↔ rem ↔ vw 自动换算',
    category: '开发'
  },
  {
    id: 'color',
    name: '颜色格式转换',
    icon: MagicStick,
    component: markRaw(ColorConverter),
    desc: 'HEX ↔ RGB ↔ RGBA ↔ HSL 转换与取色',
    category: '开发'
  },
  {
    id: 'mock-gen',
    name: 'Mock 数据生成',
    icon: DataAnalysis,
    component: markRaw(MockGenerator),
    desc: '根据 JSON 模板生成随机模拟数据',
    category: '开发'
  },
  {
    id: 'nginx-check',
    name: 'Nginx 配置检查',
    icon: Operation,
    component: markRaw(NginxValidator),
    desc: 'Nginx 配置文件语法高亮与基础校验',
    category: '开发'
  },
  {
    id: 'hash-gen',
    name: '哈希生成器',
    icon: Lock,
    component: markRaw(HashGenerator),
    desc: '计算文本/文件 MD5, SHA1, SHA256 哈希值',
    category: '加密'
  },
]

// State
const currentToolId = ref<string | null>(null)
const searchQuery = ref('')

// Computed
const filteredTools = computed(() => {
  if (!searchQuery.value) return tools
  const query = searchQuery.value.toLowerCase()
  return tools.filter(t => 
    t.name.toLowerCase().includes(query) || 
    t.desc.toLowerCase().includes(query)
  )
})

const currentTool = computed(() => {
  return tools.find(t => t.id === currentToolId.value)
})

// Methods
const selectTool = (id: string) => {
  currentToolId.value = id
}

const backToDashboard = () => {
  currentToolId.value = null
}

onMounted(() => {
  document.title = '在线工具箱 - 紫兰轩'
})
</script>

<template>
  <div class="min-h-screen w-full bg-[var(--bg-primary)] relative pt-20 flex flex-col transition-colors duration-300">
    <div class="absolute inset-0 z-0 opacity-50 pointer-events-none">
       <!-- Subtle gradient using CSS variables if needed, or just keep it simple/transparent -->
    </div>
    
    <div class="relative z-10 w-full container mx-auto px-4 pb-6 flex-1 flex gap-6 h-[calc(100vh-80px)]">
      
      <!-- Sidebar -->
      <aside class="w-64 bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border-color)] rounded-xl flex flex-col hidden md:flex shadow-sm transition-colors duration-300">
        <div class="p-4 border-b border-[var(--border-color)]">
          <div class="flex items-center gap-2 text-[var(--text-primary)] font-bold text-lg mb-4">
            <el-icon><IconMenu /></el-icon> 工具列表
          </div>
          <el-input
            v-model="searchQuery"
            placeholder="搜索工具..."
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
        </div>
        
        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div 
            v-for="tool in filteredTools" 
            :key="tool.id"
            @click="selectTool(tool.id)"
            class="px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-3 text-sm"
            :class="currentToolId === tool.id ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-blue-600'"
          >
            <el-icon><component :is="tool.icon" /></el-icon>
            {{ tool.name }}
          </div>
          
          <div v-if="filteredTools.length === 0" class="text-center text-[var(--text-tertiary)] py-4 text-sm">
            无匹配工具
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col relative shadow-sm transition-colors duration-300">
        
        <!-- Breadcrumb / Header -->
        <header class="h-14 border-b border-[var(--border-color)] flex items-center px-4 justify-between bg-[var(--bg-tertiary)] transition-colors duration-300">
          <div class="flex items-center gap-2 text-[var(--text-primary)]">
            <template v-if="currentTool">
              <el-button link @click="backToDashboard" class="text-[var(--text-secondary)] hover:text-blue-600">
                <el-icon><Back /></el-icon> 首页
              </el-button>
              <el-icon class="text-[var(--text-tertiary)]"><ArrowRight /></el-icon>
              <span class="font-bold flex items-center gap-2">
                <el-icon><component :is="currentTool.icon" /></el-icon>
                {{ currentTool.name }}
              </span>
            </template>
            <template v-else>
              <span class="font-bold">工具仪表盘</span>
            </template>
          </div>
        </header>

        <!-- Content Body -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-transparent">
          
          <!-- Dashboard View -->
          <div v-if="!currentTool" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="tool in filteredTools" 
              :key="tool.id"
              @click="selectTool(tool.id)"
              class="bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-blue-500 hover:shadow-md rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="p-2 rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <el-icon :size="24"><component :is="tool.icon" /></el-icon>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                  {{ tool.category }}
                </span>
              </div>
              <h3 class="text-[var(--text-primary)] font-bold mb-1 group-hover:text-blue-600 transition-colors">{{ tool.name }}</h3>
              <p class="text-[var(--text-secondary)] text-sm line-clamp-2">{{ tool.desc }}</p>
            </div>
          </div>

          <!-- Tool View -->
          <div v-else class="h-full">
            <component :is="currentTool.component" />
          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

:deep(.el-input__wrapper) {
  background-color: var(--input-bg);
  box-shadow: none;
  border: 1px solid var(--input-border);
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
  border-color: #409eff;
}
:deep(.el-input__inner) {
  color: var(--input-text);
}
</style>
