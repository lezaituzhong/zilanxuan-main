<script setup lang="ts">
import { ref, watch } from 'vue'
import { CopyDocument, Clock, Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { CronExpressionParser } from 'cron-parser'

// State
const activeTab = ref('second')
const cronResult = ref('* * * * * ?')
const nextRuns = ref<string[]>([])
const parsingError = ref('')

// Configuration State
const second = ref({ type: 'every', range: [0, 59], cycle: [0, 1], specific: [] as number[] })
const minute = ref({ type: 'every', range: [0, 59], cycle: [0, 1], specific: [] as number[] })
const hour = ref({ type: 'every', range: [0, 23], cycle: [0, 1], specific: [] as number[] })
const day = ref({ type: 'every', range: [1, 31], cycle: [1, 1], specific: [] as number[], last: false, workDay: false })
const month = ref({ type: 'every', range: [1, 12], cycle: [1, 1], specific: [] as number[] })
const week = ref({ type: 'any', range: [1, 7], cycle: [1, 1], specific: [] as number[], last: false })
const year = ref({ type: 'any', range: [2024, 2030], specific: [] as number[] })

// Constants
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Methods to build cron string
const presets = [
  { label: '每分钟', key: 'minutely' },
  { label: '每小时', key: 'hourly' },
  { label: '每天 0点', key: 'daily' },
  { label: '每周一 0点', key: 'weekly' },
  { label: '每月1日 0点', key: 'monthly' }
]

const loadPreset = (key: string) => {
    // Reset basics
    second.value.type = 'specific'
    second.value.specific = [0]
    minute.value.type = 'specific'
    minute.value.specific = [0]
    hour.value.type = 'specific'
    hour.value.specific = [0]
    day.value.type = 'every'
    month.value.type = 'every'
    week.value.type = 'any'
    year.value.type = 'any'

    switch(key) {
        case 'minutely':
            minute.value.type = 'every'
            hour.value.type = 'every'
            break
        case 'hourly':
            minute.value.specific = [0]
            hour.value.type = 'every'
            break
        case 'daily':
            // 0 0 0 * * ?
            // Defaults are already 0 0 0
            break
        case 'weekly':
            // 0 0 0 ? * 2 (Mon)
            day.value.type = 'any'
            week.value.type = 'specific'
            week.value.specific = [2] // 1=Sun, 2=Mon
            break
        case 'monthly':
            // 0 0 0 1 * ?
            day.value.type = 'specific'
            day.value.specific = [1]
            break
    }
    ElMessage.success('已应用预设: ' + presets.find(p => p.key === key)?.label)
}

const buildCronPart = (config: any, isWeek = false) => {
  const { type, range, cycle, specific } = config
  switch (type) {
    case 'every': return '*'
    case 'any': return '?'
    case 'range': return `${range[0]}-${range[1]}`
    case 'cycle': return `${cycle[0]}/${cycle[1]}`
    case 'specific': return specific.length > 0 ? [...specific].sort((a: number, b: number) => a - b).join(',') : '*'
    case 'last': return isWeek ? `${specific[0]}L` : 'L'
    case 'workDay': return `${specific[0]}W`
    default: return '*'
  }
}

// Watchers to update result
watch([second, minute, hour, day, month, week, year], () => {
  updateCron()
}, { deep: true })

const updateCron = () => {
  // Handle Day/Week conflict
  let dVal = buildCronPart(day.value)
  let wVal = buildCronPart(week.value, true)
  
  // Standard Quartz Cron logic: Day and Week cannot both be specified (not '?')
  // If user sets specific day, week becomes '?'
  // If user sets specific week, day becomes '?'
  if (day.value.type !== 'any' && day.value.type !== 'every') {
      wVal = '?'
  } else if (week.value.type !== 'any' && week.value.type !== 'every') {
      dVal = '?'
  } else {
      // Both every/any, prefer Day=* and Week=?
      dVal = '*'
      wVal = '?'
  }

  const parts = [
    buildCronPart(second.value),
    buildCronPart(minute.value),
    buildCronPart(hour.value),
    dVal,
    buildCronPart(month.value),
    wVal
  ]
  
  // Year is optional in some standards but we'll omit if standard * or empty
  if (year.value.type !== 'every' && year.value.type !== 'any') {
     parts.push(buildCronPart(year.value))
  }

  cronResult.value = parts.join(' ')
  calculateNextRuns()
}

const calculateNextRuns = () => {
  try {
    // Note: cron-parser standard doesn't fully support '?' or 'L' in standard mode sometimes, 
    // but for display we use standard format. We might need to adjust for parser compatibility if needed.
    // For now, we try to parse.
    
    // Replace '?' with '*' for parser compatibility if needed or handle standard cron
    // cron-parser supports most standard cron formats.
    
    const interval = CronExpressionParser.parse(cronResult.value)
    const runs = []
    for (let i = 0; i < 5; i++) {
      const date = interval.next().toDate()
      // Format date to yyyy-MM-dd HH:mm:ss
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      runs.push(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`)
    }
    nextRuns.value = runs
    parsingError.value = ''
  } catch (e: any) {
    nextRuns.value = []
    parsingError.value = '表达式无效或不支持: ' + e.message
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(cronResult.value)
    ElMessage.success('Cron 表达式已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// Initial calculation
updateCron()

</script>

<template>
  <div class="h-full flex flex-col gap-4 text-[var(--text-primary)]">
    
    <!-- Display & Preview Area -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch justify-between transition-colors duration-300">
      <div class="flex-1 w-full flex flex-col justify-center">
        <div class="flex gap-2 items-center">
            <div class="text-sm text-[var(--text-tertiary)] whitespace-nowrap">Cron 表达式:</div>
            <el-input 
                v-model="cronResult" 
                size="default" 
                readonly 
                class="font-mono flex-1"
            >
                <template #prefix><el-icon><Clock /></el-icon></template>
            </el-input>
            <el-button type="primary" size="default" :icon="CopyDocument" @click="copyToClipboard">复制</el-button>
        </div>
      </div>
      
      <div class="w-full md:w-auto min-w-[300px] bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border-color)] text-xs transition-colors duration-300">
        <div class="text-[var(--text-tertiary)] mb-1 flex items-center gap-2">
            <el-icon><Calendar /></el-icon> 最近5次运行:
        </div>
        <div v-if="!parsingError" class="space-y-0.5">
            <div v-for="(run, idx) in nextRuns" :key="idx" class="text-emerald-500 font-mono">
                {{ run }}
            </div>
        </div>
        <div v-else class="text-red-500">
            {{ parsingError }}
        </div>
      </div>
    </div>

    <!-- Configuration Tabs -->
    <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col transition-colors duration-300">
      <div class="p-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-wrap gap-2 items-center transition-colors duration-300">
          <span class="text-xs text-[var(--text-tertiary)] mr-1">常用预设:</span>
          <el-button 
            v-for="preset in presets" 
            :key="preset.key" 
            size="small"
            type="primary"
            plain
            class="!bg-transparent hover:!bg-[var(--bg-tertiary)]"
            @click="loadPreset(preset.key)"
          >
            {{ preset.label }}
          </el-button>
      </div>
      <el-tabs v-model="activeTab" class="h-full custom-tabs">
        
        <!-- Seconds -->
        <el-tab-pane label="秒" name="second">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="second.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每秒 允许的通配符[, - * /]</el-radio>
                    <el-radio label="cycle">
                        周期从 
                        <el-input-number v-model="second.cycle[0]" :min="0" :max="58" size="small" controls-position="right" class="w-20 mx-2" /> 
                        秒开始，每 
                        <el-input-number v-model="second.cycle[1]" :min="1" :max="59" size="small" controls-position="right" class="w-20 mx-2" /> 
                        秒执行一次
                    </el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="second.range[0]" :min="0" :max="58" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="second.range[1]" :min="2" :max="59" size="small" controls-position="right" class="w-20 mx-2" /> 
                        秒
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="second.specific" class="mt-1 grid grid-cols-10 gap-1">
                            <el-checkbox v-for="i in 60" :key="i-1" :label="i-1" border size="small">{{ i-1 }}</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Minutes -->
        <el-tab-pane label="分" name="minute">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="minute.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每分 允许的通配符[, - * /]</el-radio>
                    <el-radio label="cycle">
                        周期从 
                        <el-input-number v-model="minute.cycle[0]" :min="0" :max="58" size="small" controls-position="right" class="w-20 mx-2" /> 
                        分开始，每 
                        <el-input-number v-model="minute.cycle[1]" :min="1" :max="59" size="small" controls-position="right" class="w-20 mx-2" /> 
                        分执行一次
                    </el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="minute.range[0]" :min="0" :max="58" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="minute.range[1]" :min="2" :max="59" size="small" controls-position="right" class="w-20 mx-2" /> 
                        分
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="minute.specific" class="mt-1 grid grid-cols-10 gap-1">
                            <el-checkbox v-for="i in 60" :key="i-1" :label="i-1" border size="small">{{ i-1 }}</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Hours -->
        <el-tab-pane label="时" name="hour">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="hour.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每小时 允许的通配符[, - * /]</el-radio>
                    <el-radio label="cycle">
                        周期从 
                        <el-input-number v-model="hour.cycle[0]" :min="0" :max="23" size="small" controls-position="right" class="w-20 mx-2" /> 
                        时开始，每 
                        <el-input-number v-model="hour.cycle[1]" :min="1" :max="23" size="small" controls-position="right" class="w-20 mx-2" /> 
                        小时执行一次
                    </el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="hour.range[0]" :min="0" :max="23" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="hour.range[1]" :min="2" :max="23" size="small" controls-position="right" class="w-20 mx-2" /> 
                        时
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="hour.specific" class="mt-1 grid grid-cols-12 gap-1">
                            <el-checkbox v-for="i in 24" :key="i-1" :label="i-1" border size="small">{{ i-1 }}</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Day -->
        <el-tab-pane label="日" name="day">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="day.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每日 允许的通配符[, - * / L W]</el-radio>
                    <el-radio label="any">不指定 (?)</el-radio>
                    <el-radio label="cycle">
                        周期从 
                        <el-input-number v-model="day.cycle[0]" :min="1" :max="31" size="small" controls-position="right" class="w-20 mx-2" /> 
                        日开始，每 
                        <el-input-number v-model="day.cycle[1]" :min="1" :max="31" size="small" controls-position="right" class="w-20 mx-2" /> 
                        日执行一次
                    </el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="day.range[0]" :min="1" :max="31" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="day.range[1]" :min="2" :max="31" size="small" controls-position="right" class="w-20 mx-2" /> 
                        日
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="day.specific" class="mt-1 grid grid-cols-10 gap-1">
                            <el-checkbox v-for="i in 31" :key="i" :label="i" border size="small">{{ i }}</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Month -->
        <el-tab-pane label="月" name="month">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="month.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每月 允许的通配符[, - * /]</el-radio>
                    <el-radio label="cycle">
                        周期从 
                        <el-input-number v-model="month.cycle[0]" :min="1" :max="12" size="small" controls-position="right" class="w-20 mx-2" /> 
                        月开始，每 
                        <el-input-number v-model="month.cycle[1]" :min="1" :max="12" size="small" controls-position="right" class="w-20 mx-2" /> 
                        月执行一次
                    </el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="month.range[0]" :min="1" :max="12" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="month.range[1]" :min="2" :max="12" size="small" controls-position="right" class="w-20 mx-2" /> 
                        月
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="month.specific" class="mt-1 grid grid-cols-6 gap-1">
                            <el-checkbox v-for="i in 12" :key="i" :label="i" border size="small">{{ i }}月</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Week -->
        <el-tab-pane label="周" name="week">
            <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="week.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="every">每周 允许的通配符[, - * / L #]</el-radio>
                    <el-radio label="any">不指定 (?)</el-radio>
                    <el-radio label="range">
                        周期从星期 
                        <el-input-number v-model="week.range[0]" :min="1" :max="7" size="small" controls-position="right" class="w-20 mx-2" /> 
                        - 
                        <el-input-number v-model="week.range[1]" :min="2" :max="7" size="small" controls-position="right" class="w-20 mx-2" /> 
                    </el-radio>
                    <el-radio label="specific">
                        指定
                        <el-checkbox-group v-model="week.specific" class="mt-1 grid grid-cols-7 gap-1">
                            <el-checkbox v-for="(d, i) in weekDays" :key="i" :label="i + 1" border size="small">{{ d }}</el-checkbox>
                        </el-checkbox-group>
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

        <!-- Year -->
        <el-tab-pane label="年" name="year">
             <div class="py-4 pr-4 pl-8 space-y-2">
                <el-radio-group v-model="year.type" class="flex flex-col gap-2 items-start">
                    <el-radio label="any">不指定 允许的通配符[, - * /] 非必填</el-radio>
                    <el-radio label="every">每年</el-radio>
                    <el-radio label="range">
                        周期从 
                        <el-input-number v-model="year.range[0]" :min="2024" :max="2099" size="small" controls-position="right" class="w-24 mx-2" /> 
                        - 
                        <el-input-number v-model="year.range[1]" :min="2025" :max="2099" size="small" controls-position="right" class="w-24 mx-2" /> 
                        年
                    </el-radio>
                </el-radio-group>
            </div>
        </el-tab-pane>

      </el-tabs>
    </div>

  </div>
</template>

<style scoped>
/* Element Plus Overrides for Dark Theme */
:deep(.el-tabs__header) {
    margin-bottom: 0;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding-left: 24px; /* Tab 标题栏往右移 */
}
:deep(.el-tabs__item) {
    color: var(--text-secondary);
    padding: 0 24px !important; /* 增加 Tab 间距 */
    transition: all 0.3s;
}
:deep(.el-tabs__item:hover) {
    color: var(--text-primary);
    background-color: var(--bg-tertiary);
}
:deep(.el-tabs__item.is-active) {
    color: var(--text-on-accent);
    background-color: var(--accent-color); /* 选中状态加背景色 */
    font-weight: bold;
}
:deep(.el-tabs__nav-wrap::after) {
    background-color: transparent;
}
:deep(.el-radio) {
    color: var(--text-secondary);
    margin-right: 0;
    height: auto;
    padding: 6px 0;
}
:deep(.el-radio__label) {
    white-space: normal;
    line-height: 1.5;
}
:deep(.el-radio__input.is-checked + .el-radio__label) {
    color: var(--accent-color);
}
:deep(.el-checkbox) {
    color: var(--text-secondary);
    margin-right: 0;
}
:deep(.el-checkbox.is-bordered) {
    border-color: var(--border-color);
}
:deep(.el-checkbox.is-bordered.is-checked) {
    border-color: var(--accent-color);
}
:deep(.el-input-number.is-controls-right .el-input__wrapper) {
    padding-left: 0;
    padding-right: 30px;
}
:deep(.el-input__wrapper) {
    background-color: var(--input-bg);
    box-shadow: 0 0 0 1px var(--input-border) inset;
}
:deep(.el-tabs__content) {
    height: calc(100% - 40px);
    overflow-y: auto;
}
</style>
