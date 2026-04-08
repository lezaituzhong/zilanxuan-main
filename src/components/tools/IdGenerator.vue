<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 transition-colors duration-300">
        <el-icon><Key /></el-icon>
        多功能 ID / 密钥生成器
      </h2>
    </div>

    <!-- Main Content -->
    <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col overflow-hidden transition-colors duration-300">
      <el-tabs v-model="activeTab" class="h-full flex flex-col">
        
        <!-- UUID Tab -->
        <el-tab-pane label="UUID 生成" name="uuid" class="h-full">
          <div class="flex flex-col h-full gap-4">
            <div class="flex flex-wrap gap-4 items-end bg-[var(--bg-tertiary)] p-4 rounded-lg transition-colors duration-300">
              <div>
                <div class="text-sm text-[var(--text-secondary)] mb-2">生成数量 (1-100)</div>
                <el-input-number v-model="uuidCount" :min="1" :max="100" />
              </div>
              <div class="flex flex-col gap-2">
                 <div class="text-sm text-[var(--text-secondary)]">选项</div>
                 <el-checkbox v-model="uuidHyphens" label="包含连字符 (-)" border />
              </div>
              <el-button type="primary" :icon="Refresh" @click="generateUUIDs">生成 UUID</el-button>
            </div>
            
            <div class="flex-1 relative">
               <el-input
                 v-model="uuidResult"
                 type="textarea"
                 class="h-full"
                 :input-style="{ height: '100%', fontFamily: 'monospace', resize: 'none' }"
                 placeholder="生成的 UUID 将显示在这里"
                 readonly
               />
               <div class="absolute top-2 right-2">
                  <el-button size="small" :icon="CopyDocument" @click="copyText(uuidResult)" v-if="uuidResult">复制</el-button>
               </div>
            </div>
            <div v-if="uuidStats" class="text-xs text-[var(--text-tertiary)] text-right">
              耗时: {{ uuidStats }}ms | 算法: UUID v4 (RFC 4122)
            </div>
          </div>
        </el-tab-pane>

        <!-- Snowflake Tab -->
        <el-tab-pane label="雪花算法 ID" name="snowflake" class="h-full">
           <div class="flex flex-col h-full gap-4">
             <div class="flex flex-wrap gap-4 items-end bg-[var(--bg-tertiary)] p-4 rounded-lg transition-colors duration-300">
               <div>
                 <div class="text-sm text-[var(--text-secondary)] mb-2">数据中心 ID (0-31)</div>
                 <el-input-number v-model="sfDataCenterId" :min="0" :max="31" />
               </div>
               <div>
                 <div class="text-sm text-[var(--text-secondary)] mb-2">工作节点 ID (0-31)</div>
                 <el-input-number v-model="sfWorkerId" :min="0" :max="31" />
               </div>
               <el-button type="primary" :icon="Refresh" @click="generateSnowflake">生成 ID</el-button>
             </div>

             <div class="flex-1 flex flex-col items-center justify-center bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] relative transition-colors duration-300">
                <div v-if="sfResult" class="text-center">
                   <div class="text-sm text-[var(--text-secondary)] mb-2">Generated ID</div>
                   <div class="text-4xl md:text-6xl font-mono font-bold text-[var(--text-primary)] tracking-wider mb-6 select-all">{{ sfResult.id }}</div>
                   <div class="flex gap-4 justify-center text-sm text-[var(--text-tertiary)] font-mono">
                      <div class="bg-[var(--bg-secondary)] px-3 py-1 rounded border border-[var(--border-color)]">Length: {{ sfResult.id.length }}</div>
                      <div class="bg-[var(--bg-secondary)] px-3 py-1 rounded border border-[var(--border-color)]">Binary Length: 64 bit</div>
                   </div>
                   <el-button class="mt-8" :icon="CopyDocument" round @click="copyText(sfResult.id)">复制 ID</el-button>
                </div>
                <div v-else class="text-[var(--text-tertiary)]">点击生成按钮获取新的雪花 ID</div>
             </div>
             
             <div v-if="sfStats" class="text-xs text-[var(--text-tertiary)] text-right">
               耗时: {{ sfStats }}ms | 算法: Twitter Snowflake
             </div>
           </div>
        </el-tab-pane>

        <!-- Key Pair Tab -->
        <el-tab-pane label="密钥对生成" name="keypair" class="h-full">
           <div class="flex flex-col h-full gap-4 overflow-y-auto custom-scrollbar">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[var(--bg-tertiary)] p-4 rounded-lg transition-colors duration-300">
                 <div>
                    <div class="text-sm text-[var(--text-secondary)] mb-2">算法</div>
                    <el-select v-model="keyAlgo" placeholder="选择算法">
                       <el-option label="RSA" value="RSA" />
                       <el-option label="ECC (Elliptic Curve)" value="ECC" />
                       <el-option label="Ed25519" value="Ed25519" />
                    </el-select>
                 </div>
                 
                 <div v-if="keyAlgo === 'RSA'">
                    <div class="text-sm text-[var(--text-secondary)] mb-2">密钥长度</div>
                    <el-select v-model="rsaLength">
                       <el-option label="2048 bits" :value="2048" />
                       <el-option label="4096 bits" :value="4096" />
                    </el-select>
                 </div>

                 <div v-if="keyAlgo === 'ECC'">
                    <div class="text-sm text-[var(--text-secondary)] mb-2">曲线</div>
                    <el-select v-model="eccCurve">
                       <el-option label="P-256" value="P-256" />
                       <el-option label="P-384" value="P-384" />
                    </el-select>
                 </div>

                 <div>
                    <div class="text-sm text-[var(--text-secondary)] mb-2">输出格式</div>
                    <el-select v-model="keyFormat">
                       <el-option label="PEM" value="PEM" />
                       <el-option label="JWK" value="JWK" />
                    </el-select>
                 </div>

                 <div class="flex items-end">
                    <el-button type="primary" :icon="Refresh" :loading="keyLoading" @click="generateKeys" class="w-full">生成密钥对</el-button>
                 </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
                 <div class="flex flex-col gap-2">
                    <div class="flex justify-between text-sm text-[var(--text-secondary)]">
                       <span>Public Key</span>
                       <el-button link :icon="CopyDocument" @click="copyText(keyResult.publicKey)" :disabled="!keyResult.publicKey">复制</el-button>
                    </div>
                    <el-input 
                       v-model="keyResultDisplay.publicKey" 
                       type="textarea" 
                       class="flex-1 h-full"
                       :input-style="{ height: '100%', fontFamily: 'monospace', resize: 'none', fontSize: '12px' }"
                       readonly 
                    />
                 </div>
                 <div class="flex flex-col gap-2">
                    <div class="flex justify-between text-sm text-[var(--text-secondary)]">
                       <span>Private Key</span>
                       <el-button link :icon="CopyDocument" @click="copyText(keyResult.privateKey)" :disabled="!keyResult.privateKey">复制</el-button>
                    </div>
                    <el-input 
                       v-model="keyResultDisplay.privateKey" 
                       type="textarea" 
                       class="flex-1 h-full"
                       :input-style="{ height: '100%', fontFamily: 'monospace', resize: 'none', fontSize: '12px' }"
                       readonly 
                    />
                 </div>
              </div>

              <div v-if="keyStats" class="text-xs text-[var(--text-tertiary)] text-right">
                耗时: {{ keyStats }}ms | Web Crypto API
              </div>
           </div>
        </el-tab-pane>

      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Key, Refresh, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { SnowflakeId } from '@/utils/snowflake'
import { generateKeyPair } from '@/utils/crypto-helper'

const activeTab = ref('uuid')

// --- UUID Logic ---
const uuidCount = ref(5)
const uuidHyphens = ref(true)
const uuidResult = ref('')
const uuidStats = ref(0)

const generateUUIDs = () => {
   const start = performance.now()
   try {
      const ids = []
      for (let i = 0; i < uuidCount.value; i++) {
         let id = uuidv4()
         if (!uuidHyphens.value) {
            id = id.replace(/-/g, '')
         }
         ids.push(id)
      }
      uuidResult.value = JSON.stringify({
         timestamp: new Date().toISOString(),
         algorithm: 'UUID v4 (RFC 4122)',
         count: uuidCount.value,
         ids: ids
      }, null, 2)
   } catch (e) {
      ElMessage.error('生成失败')
   }
   uuidStats.value = Math.round(performance.now() - start)
}

// --- Snowflake Logic ---
const sfDataCenterId = ref(1)
const sfWorkerId = ref(1)
const sfResult = ref<{ id: string } | null>(null)
const sfStats = ref(0)
let snowflakeInstance: SnowflakeId | null = null

const generateSnowflake = () => {
   const start = performance.now()
   try {
      // Re-instantiate if params changed (simple approach) or maintain instance
      // For simplicity and to allow param changes, we create new instance or update it
      // SnowflakeId class keeps state (sequence), so ideally we should keep one instance per DC/Worker combo.
      // But user can change inputs freely. Let's create new one if inputs changed significantly or just for this demo create new one?
      // Creating new one might reset sequence, risking collision in same millisecond if user clicks super fast?
      // But JS is single threaded.
      // Better: Store instance.
      if (!snowflakeInstance || snowflakeInstance['workerId'] !== BigInt(sfWorkerId.value) || snowflakeInstance['dataCenterId'] !== BigInt(sfDataCenterId.value)) {
          snowflakeInstance = new SnowflakeId(sfWorkerId.value, sfDataCenterId.value)
      }
      
      const id = snowflakeInstance.nextId()
      sfResult.value = { id }
   } catch (e: any) {
      ElMessage.error(e.message)
   }
   sfStats.value = Math.round(performance.now() - start)
}

// --- Key Pair Logic ---
const keyAlgo = ref<'RSA' | 'ECC' | 'Ed25519'>('RSA')
const rsaLength = ref(2048)
const eccCurve = ref('P-256')
const keyFormat = ref<'PEM' | 'JWK'>('PEM')
const keyLoading = ref(false)
const keyResult = ref<{ publicKey: any, privateKey: any }>({ publicKey: '', privateKey: '' })
const keyStats = ref(0)

const keyResultDisplay = computed(() => {
   const fmt = (val: any) => typeof val === 'object' ? JSON.stringify(val, null, 2) : val
   return {
      publicKey: fmt(keyResult.value.publicKey),
      privateKey: fmt(keyResult.value.privateKey)
   }
})

const generateKeys = async () => {
   keyLoading.value = true
   const start = performance.now()
   try {
      const res = await generateKeyPair(
         keyAlgo.value, 
         { length: rsaLength.value, curve: eccCurve.value }, 
         keyFormat.value
      )
      keyResult.value = {
         publicKey: res.publicKey,
         privateKey: res.privateKey
      }
   } catch (e: any) {
      ElMessage.error(e.message)
      keyResult.value = { publicKey: '', privateKey: '' }
   } finally {
      keyLoading.value = false
      keyStats.value = Math.round(performance.now() - start)
   }
}

// --- Common ---
const copyText = async (text: string | object) => {
   if (!text) return
   const str = typeof text === 'object' ? JSON.stringify(text, null, 2) : text
   try {
      await navigator.clipboard.writeText(str)
      ElMessage.success('已复制到剪贴板')
   } catch (e) {
      ElMessage.error('复制失败')
   }
}
</script>

<style scoped>
:deep(.el-tabs__content) {
  height: calc(100% - 40px);
  padding: 16px 0 0 0;
  overflow: hidden;
}
</style>