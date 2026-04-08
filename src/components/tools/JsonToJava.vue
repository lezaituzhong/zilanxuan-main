<script setup lang="ts">
import { ref } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'
import { ElMessage } from 'element-plus'
import { Right, CopyDocument, Delete } from '@element-plus/icons-vue'

// --- State ---
const activeTab = ref('json2java')

// JSON to Java State
const jsonInput = ref('{\n  "id": 1,\n  "username": "admin",\n  "isActive": true,\n  "roles": ["ADMIN", "USER"],\n  "details": {\n    "age": 30,\n    "email": "test@example.com"\n  }\n}')
const javaOutput = ref('')
const className = ref('Root')
const packageName = ref('com.example.model')
const useLombok = ref(true)
const useJsonAnnotations = ref('jackson') // none, jackson, gson

// Java to JSON State
const javaInput = ref(`@Data
public class User {
    private Long id;
    private String username;
    private Boolean isActive;
    private List<String> roles;
    private UserDetails details;
}

@Data
class UserDetails {
    private Integer age;
    private String email;
}`)
const jsonOutput = ref('')

// --- Computed ---
const extensionsJson = [json(), oneDark]
const extensionsJava = [java(), oneDark]

// --- Logic: JSON -> Java ---

const mapType = (value: any): string => {
  if (value === null) return 'Object'
  switch (typeof value) {
    case 'string': return 'String'
    case 'number': return Number.isInteger(value) ? 'Integer' : 'Double'
    case 'boolean': return 'Boolean'
    case 'object': return Array.isArray(value) ? 'List' : 'Object' // Special handling in recursion
    default: return 'Object'
  }
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
            .replace(/^[A-Z]/, (c) => c.toLowerCase())
}

interface Field {
  originalName: string // JSON key
  javaName: string // Java field name
  type: string
  isList: boolean
  listType?: string // for List<T>
  nestedClass?: string // content of inner class
}

const generateJavaClass = (name: string, obj: any, isInner: boolean = false): { code: string, innerClasses: string[], hasAnnotations: boolean, hasList: boolean } => {
  const fields: Field[] = []
  const innerClasses: string[] = []
  let hasAnnotations = false
  let hasList = false

  for (const key in obj) {
    const value = obj[key]
    const fieldType = mapType(value)
    const javaName = toCamelCase(key)
    
    if (fieldType === 'List') {
      hasList = true
      let listType = 'Object'
      if (value.length > 0) {
        const firstItem = value[0]
        const itemType = mapType(firstItem)
        if (itemType === 'Object' && typeof firstItem === 'object' && firstItem !== null) {
          // Nested object in list
          const innerClassName = capitalize(javaName)
          const { code: innerCode, innerClasses: nestedInners, hasAnnotations: innerHasAnnotations, hasList: innerHasList } = generateJavaClass(innerClassName, firstItem, true)
          innerClasses.push(innerCode, ...nestedInners)
          if (innerHasAnnotations) hasAnnotations = true
          if (innerHasList) hasList = true
          listType = innerClassName
        } else {
          listType = itemType
        }
      }
      fields.push({ originalName: key, javaName, type: 'List', isList: true, listType })
    } else if (fieldType === 'Object' && typeof value === 'object' && value !== null) {
       // Nested object
       const innerClassName = capitalize(javaName)
       const { code: innerCode, innerClasses: nestedInners, hasAnnotations: innerHasAnnotations, hasList: innerHasList } = generateJavaClass(innerClassName, value, true)
       innerClasses.push(innerCode, ...nestedInners)
       if (innerHasAnnotations) hasAnnotations = true
       if (innerHasList) hasList = true
       fields.push({ originalName: key, javaName, type: innerClassName, isList: false })
    } else {
      fields.push({ originalName: key, javaName, type: fieldType, isList: false })
    }
  }

  let classCode = ''
  
  // Annotations
  if (useLombok.value) {
    classCode += '@Data\n'
  }

  classCode += `public ${isInner ? 'static ' : ''}class ${name} {\n`
  
  fields.forEach(f => {
    // JSON Annotation
    // Only add annotation if original name differs from java name (e.g. "HaName" vs "haName", "user_id" vs "userId")
    const needsAnnotation = f.originalName !== f.javaName
    
    if (needsAnnotation) {
      if (useJsonAnnotations.value === 'jackson') {
        classCode += `    @JsonProperty("${f.originalName}")\n`
        hasAnnotations = true
      } else if (useJsonAnnotations.value === 'gson') {
        classCode += `    @SerializedName("${f.originalName}")\n`
        hasAnnotations = true
      }
    }

    const typeStr = f.isList ? `List<${f.listType}>` : f.type
    classCode += `    private ${typeStr} ${f.javaName};\n`
  })

  // Getters/Setters (if no Lombok)
  if (!useLombok.value) {
    classCode += '\n'
    fields.forEach(f => {
       const typeStr = f.isList ? `List<${f.listType}>` : f.type
       const capName = capitalize(f.javaName)
       // Getter
       classCode += `    public ${typeStr} get${capName}() { return ${f.javaName}; }\n`
       // Setter
       classCode += `    public void set${capName}(${typeStr} ${f.javaName}) { this.${f.javaName} = ${f.javaName}; }\n`
    })
  }

  classCode += '}\n'

  return { code: classCode, innerClasses, hasAnnotations, hasList }
}

const convertJsonToJava = () => {
  try {
    const obj = JSON.parse(jsonInput.value)
    const rootName = capitalize(className.value || 'Root')
    
    const { code, innerClasses, hasAnnotations, hasList } = generateJavaClass(rootName, obj)
    
    let result = ''
    if (packageName.value) {
      result += `package ${packageName.value};\n\n`
    }
    
    // Imports
    if (useLombok.value) result += 'import lombok.Data;\n'
    if (useJsonAnnotations.value === 'jackson' && hasAnnotations) result += 'import com.fasterxml.jackson.annotation.JsonProperty;\n'
    if (useJsonAnnotations.value === 'gson' && hasAnnotations) result += 'import com.google.gson.annotations.SerializedName;\n'
    if (hasList) result += 'import java.util.List;\n'
    
    if (useLombok.value || (useJsonAnnotations.value !== 'none' && hasAnnotations) || hasList) {
        result += '\n'
    }

    result += code + '\n'
    result += innerClasses.join('\n')
    
    javaOutput.value = result
    ElMessage.success('转换成功')
  } catch (e: any) {
    ElMessage.error('JSON 解析失败: ' + e.message)
  }
}

// --- Logic: Java -> JSON ---

const convertJavaToJson = () => {
  try {
    const text = javaInput.value
    // Simple regex to match fields: private Type name;
    // Supports: private Type name; or Type name;
    // Ignores methods
    
    const fieldRegex = /(?:private|protected|public)?\s+([\w<>?]+)\s+(\w+)\s*(?:=.*?)?;/g
    
    const result: Record<string, any> = {}
    let match
    
    // Naive implementation: Flat parsing, doesn't handle nested classes context perfectly
    // But works for simple POJO copy-paste
    
    while ((match = fieldRegex.exec(text)) !== null) {
      const type = match[1]
      const name = match[2]
      
      if (name && type) {
          result[name] = mockValue(type)
      }
    }
    
    jsonOutput.value = JSON.stringify(result, null, 2)
    ElMessage.success('生成成功')
  } catch (e: any) {
    ElMessage.error('转换失败: ' + e.message)
  }
}

const mockValue = (type: string): any => {
  type = type.toLowerCase()
  if (type.includes('string')) return 'string_value'
  if (type.includes('int') || type.includes('long') || type.includes('byte') || type.includes('short')) return 0
  if (type.includes('double') || type.includes('float') || type.includes('decimal')) return 0.0
  if (type.includes('boolean')) return true
  if (type.includes('list') || type.includes('set') || type.includes('array')) return []
  if (type.includes('map')) return {}
  if (type.includes('date') || type.includes('time')) return '2023-01-01 12:00:00'
  return {} // Assume object
}

const copyResult = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const clear = (isJson: boolean) => {
  if (isJson) {
    jsonInput.value = ''
    javaOutput.value = ''
  } else {
    javaInput.value = ''
    jsonOutput.value = ''
  }
}

</script>

<template>
  <div class="h-full flex flex-col text-[var(--text-primary)]">
    <el-tabs v-model="activeTab" class="h-full flex flex-col">
      
      <!-- Tab 1: JSON to Java -->
      <el-tab-pane label="JSON 转 Java Bean" name="json2java">
        <div class="h-full flex flex-col p-4 gap-4">
          <!-- Options -->
          <div class="flex flex-wrap gap-4 items-center bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
             <el-input v-model="packageName" placeholder="Package Name" style="width: 200px" label="Package">
               <template #prepend>Package</template>
             </el-input>
             <el-input v-model="className" placeholder="Class Name" style="width: 150px">
                <template #prepend>Class</template>
             </el-input>
             
             <el-checkbox v-model="useLombok" label="Lombok (@Data)" border />
             
             <el-select v-model="useJsonAnnotations" placeholder="Annotations" style="width: 120px">
               <el-option label="None" value="none" />
               <el-option label="Jackson" value="jackson" />
               <el-option label="Gson" value="gson" />
             </el-select>

             <el-button type="primary" @click="convertJsonToJava" :icon="Right">转换</el-button>
             <el-button type="danger" plain @click="clear(true)" :icon="Delete">清空</el-button>
          </div>

          <!-- Editors -->
          <div class="flex-1 flex gap-4 min-h-0">
            <!-- Left: JSON Input -->
            <div class="w-1/2 flex flex-col border border-[var(--border-color)] rounded-lg overflow-hidden">
               <div class="bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-bold">JSON Input</div>
               <Codemirror
                  v-model="jsonInput"
                  placeholder="Paste JSON here..."
                  :style="{ height: '100%' }"
                  :autofocus="true"
                  :indent-with-tab="true"
                  :tab-size="2"
                  :extensions="extensionsJson"
                />
            </div>
            
            <!-- Right: Java Output -->
             <div class="w-1/2 flex flex-col border border-[var(--border-color)] rounded-lg overflow-hidden">
               <div class="bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-bold flex justify-between items-center">
                 <span>Java Bean Output</span>
                 <el-button link type="primary" :icon="CopyDocument" @click="copyResult(javaOutput)">复制</el-button>
               </div>
               <Codemirror
                  v-model="javaOutput"
                  :style="{ height: '100%' }"
                  :indent-with-tab="true"
                  :tab-size="4"
                  :extensions="extensionsJava"
                  :disabled="true"
                />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: Java to JSON -->
      <el-tab-pane label="Java Bean 转 JSON" name="java2json">
        <div class="h-full flex flex-col p-4 gap-4">
           <!-- Options -->
           <div class="flex gap-4 items-center bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
              <span class="text-sm text-gray-500">粘贴 Java 实体类代码，自动生成示例 JSON</span>
              <div class="flex-1"></div>
              <el-button type="primary" @click="convertJavaToJson" :icon="Right">生成 JSON</el-button>
              <el-button type="danger" plain @click="clear(false)" :icon="Delete">清空</el-button>
           </div>

           <!-- Editors -->
          <div class="flex-1 flex gap-4 min-h-0">
            <!-- Left: Java Input -->
            <div class="w-1/2 flex flex-col border border-[var(--border-color)] rounded-lg overflow-hidden">
               <div class="bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-bold">Java Class Input</div>
               <Codemirror
                  v-model="javaInput"
                  placeholder="Paste Java Bean code here..."
                  :style="{ height: '100%' }"
                  :autofocus="true"
                  :indent-with-tab="true"
                  :tab-size="4"
                  :extensions="extensionsJava"
                />
            </div>
            
            <!-- Right: JSON Output -->
             <div class="w-1/2 flex flex-col border border-[var(--border-color)] rounded-lg overflow-hidden">
               <div class="bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-bold flex justify-between items-center">
                 <span>JSON Output</span>
                 <el-button link type="primary" :icon="CopyDocument" @click="copyResult(jsonOutput)">复制</el-button>
               </div>
               <Codemirror
                  v-model="jsonOutput"
                  :style="{ height: '100%' }"
                  :indent-with-tab="true"
                  :tab-size="2"
                  :extensions="extensionsJson"
                  :disabled="true"
                />
            </div>
          </div>
        </div>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<style scoped>
:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 1rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}
</style>