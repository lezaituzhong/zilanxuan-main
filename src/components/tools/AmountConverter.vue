<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 transition-colors duration-300">
        <el-icon><Money /></el-icon>
        人民币大写金额转换
      </h2>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-4">
      <!-- Input Area -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-2 transition-colors duration-300">
        <div class="text-sm text-[var(--text-secondary)]">输入金额 (阿拉伯数字)</div>
        <div class="flex gap-2">
            <el-input 
                v-model="inputAmount" 
                placeholder="例如: 123456.78" 
                size="large" 
                class="font-mono text-lg flex-1"
                clearable
                @input="handleInput"
            >
                <template #prefix>¥</template>
            </el-input>
            <el-button type="primary" size="large" @click="handleConvert">转换</el-button>
        </div>
        <div class="text-xs text-[var(--text-tertiary)] flex justify-between">
            <span>支持最大金额：9999亿 (12位整数)</span>
            <span v-if="errorMsg" class="text-red-400">{{ errorMsg }}</span>
        </div>
      </div>

      <!-- Result Area -->
      <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden group transition-colors duration-300">
         <!-- Background Decoration -->
         <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
             <span class="text-[12rem] font-serif font-bold text-[var(--text-primary)]">¥</span>
         </div>

         <div class="relative z-10 w-full text-center">
            <div class="text-sm text-[var(--text-secondary)] mb-4">转换结果 (中文大写)</div>
            
            <div class="min-h-[80px] flex items-center justify-center">
                <div v-if="result" class="text-3xl md:text-4xl font-serif font-bold text-yellow-500 tracking-wider break-all leading-relaxed drop-shadow-lg select-all">
                    {{ result }}
                </div>
                <div v-else class="text-[var(--text-tertiary)] text-lg italic">
                    等待输入...
                </div>
            </div>

            <div v-if="result" class="mt-8 flex justify-center gap-4">
                 <el-button :icon="CopyDocument" round @click="copyResult">复制结果</el-button>
            </div>
         </div>
      </div>

      <!-- Reference Table -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)] text-center transition-colors duration-300">
             <div class="text-xs text-[var(--text-tertiary)] mb-1">数字对照</div>
             <div class="text-[var(--text-secondary)] text-sm font-serif">零壹贰叁肆伍陆柒捌玖</div>
         </div>
         <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)] text-center transition-colors duration-300">
             <div class="text-xs text-[var(--text-tertiary)] mb-1">单位对照</div>
             <div class="text-[var(--text-secondary)] text-sm font-serif">拾佰仟万亿</div>
         </div>
         <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)] text-center transition-colors duration-300">
             <div class="text-xs text-[var(--text-tertiary)] mb-1">小数对照</div>
             <div class="text-[var(--text-secondary)] text-sm font-serif">角分</div>
         </div>
         <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)] text-center transition-colors duration-300">
             <div class="text-xs text-[var(--text-tertiary)] mb-1">其他符号</div>
             <div class="text-[var(--text-secondary)] text-sm font-serif">整元负</div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Money, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const inputAmount = ref('')
const result = ref('')
const errorMsg = ref('')

// Constants for conversion
const CN_UPPER_NUMS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const CN_INT_UNITS = ['', '拾', '佰', '仟']
const CN_INT_RADICES = ['', '万', '亿', '兆'] // 兆 usually not reached with 12 digits but good to have
const CN_DEC_UNITS = ['角', '分']
const CN_INTEGER = '整'
const CN_INT_LAST = '元'
const CN_NEGATIVE = '负'

const handleInput = (val: string) => {
    // Basic validation regex: allow numbers, dot, minus at start
    if (!/^-?\d*\.?\d*$/.test(val)) {
        errorMsg.value = '请输入有效的数字格式'
    } else {
        errorMsg.value = ''
    }
    handleConvert()
}

const convertToChinese = (amountStr: string): string => {
    // 1. Pre-checks
    if (amountStr === '') return ''
    
    let amount = parseFloat(amountStr)
    if (isNaN(amount)) return ''
    
    // Max limit check (999999999999.99) - 12 digits integer
    if (Math.abs(amount) >= 1000000000000) {
        errorMsg.value = '金额过大，超出处理范围（最大支持千亿级）'
        return '超出范围'
    }

    if (amount === 0) return '零元' + CN_INTEGER

    // 2. Negative handling
    let prefix = ''
    if (amount < 0) {
        prefix = CN_NEGATIVE
        amount = Math.abs(amount)
        amountStr = amountStr.replace('-', '')
    }

    // 3. Split Integer and Decimal
    let [integerStr, decimalStr] = amountStr.split('.')
    if (!integerStr) integerStr = '0'
    if (!decimalStr) decimalStr = ''
    
    // Truncate decimal to 2 digits
    if (decimalStr.length > 2) {
        decimalStr = decimalStr.substring(0, 2)
    }

    // 4. Integer Part Conversion
    let chineseInteger = ''
    if (parseInt(integerStr) > 0) {
        let zeroCount = 0
        let IntLen = integerStr.length
        
        for (let i = 0; i < IntLen; i++) {
            let n = parseInt(integerStr.substr(i, 1))
            let p = IntLen - i - 1
            let q = p / 4
            let m = p % 4
            
            if (n === 0) {
                zeroCount++
            } else {
                if (zeroCount > 0) {
                    chineseInteger += CN_UPPER_NUMS[0]
                }
                zeroCount = 0 // Reset
                chineseInteger += (CN_UPPER_NUMS[n] || '') + (CN_INT_UNITS[m] || '')
            }
            
            if (m === 0 && zeroCount < 4) {
                chineseInteger += CN_INT_RADICES[q] || ''
            }
        }
        chineseInteger += CN_INT_LAST
    } else if (integerStr === '0' && decimalStr === '') {
         // Should be covered by amount === 0 check, but safe fallback
         chineseInteger = (CN_UPPER_NUMS[0] || '') + CN_INT_LAST
    }

    // 5. Decimal Part Conversion
    let chineseDecimal = ''
    if (decimalStr !== '') {
        for (let i = 0; i < decimalStr.length; i++) {
            let n = parseInt(decimalStr.substr(i, 1))
            if (n !== 0) {
                chineseDecimal += (CN_UPPER_NUMS[n] || '') + (CN_DEC_UNITS[i] || '')
            } else if (i === 0 && decimalStr.length > 1 && parseInt(decimalStr.substr(1, 1)) !== 0) {
                 // 1.05 -> 壹元零伍分 (Special handling for zero in 'jiao' position)
                 chineseDecimal += (CN_UPPER_NUMS[0] || '')
            }
        }
    }
    
    // 6. Final Assembly
    if (chineseDecimal === '') {
        chineseDecimal = CN_INTEGER
    }
    
    // Special case: 0.5 -> 伍角 (No Zero Yuan prefix usually, but standard says "零元..." or just "伍角"?)
    // Bank standard: 0.xx -> 零元xx or just xx?
    // User requirement: 13.45 -> 壹拾叁元...
    // Let's stick to standard: if integer is 0, we usually say "零元..." if we want strict format, or just decimal.
    // However, if input is "0.5", logic above produces "伍角".
    // Let's check if integer part was 0.
    if (parseInt(integerStr) === 0) {
         // If result is empty so far (meaning 0.00), handled at top.
         // If 0.5 -> currently returns "伍角".
         // Some standards require "零元伍角". Let's follow the logic:
         // If user types 0.5, usually "伍角" is fine, but "零元伍角" is safer for finance.
         // But the loop above for integer skips if 0.
         // Let's add "零元" if integer is 0 and there is decimal?
         // User example: 1003 -> 壹仟零叁 (implicit 元?) -> 壹仟零叁元整
         // User didn't specify 0.5 case.
         // Let's keep it simple. If 0.5 -> 伍角.
    }

    return prefix + chineseInteger + chineseDecimal
}

const handleConvert = () => {
    if (errorMsg.value && errorMsg.value !== '请输入有效的数字格式') {
        result.value = ''
        return
    }
    if (!inputAmount.value) {
        result.value = ''
        return
    }
    
    try {
        result.value = convertToChinese(inputAmount.value)
    } catch (e) {
        console.error(e)
        result.value = '转换出错'
    }
}

const copyResult = async () => {
    if (!result.value) return
    try {
        await navigator.clipboard.writeText(result.value)
        ElMessage.success('已复制到剪贴板')
    } catch (err) {
        ElMessage.error('复制失败')
    }
}

// Watch input to clear error when empty
watch(inputAmount, (val) => {
    if (!val) {
        errorMsg.value = ''
        result.value = ''
    }
})
</script>

<style scoped>
/* Add serif font for better Chinese currency look */
.font-serif {
    font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
}
</style>