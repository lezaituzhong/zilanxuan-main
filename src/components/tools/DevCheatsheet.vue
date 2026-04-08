<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('escape')
const searchQuery = ref('')

// --- Data ---

const escapeChars = [
  { char: '&lt;', origin: '<', desc: '小于号 (less than)' },
  { char: '&gt;', origin: '>', desc: '大于号 (greater than)' },
  { char: '&amp;', origin: '&', desc: '和号 (ampersand)' },
  { char: '&apos;', origin: "'", desc: '单引号 (apostrophe)' },
  { char: '&quot;', origin: '"', desc: '双引号 (quotation mark)' },
  { char: '&nbsp;', origin: ' ', desc: '空格 (non-breaking space)' },
]

const mimeTypes = [
  { ext: '.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', desc: 'Excel (2007+)' },
  { ext: '.xls', type: 'application/vnd.ms-excel', desc: 'Excel (Old)' },
  { ext: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', desc: 'Word (2007+)' },
  { ext: '.doc', type: 'application/msword', desc: 'Word (Old)' },
  { ext: '.pdf', type: 'application/pdf', desc: 'PDF Document' },
  { ext: '.json', type: 'application/json', desc: 'JSON Data' },
  { ext: '.xml', type: 'application/xml', desc: 'XML Data' },
  { ext: '.zip', type: 'application/zip', desc: 'ZIP Archive' },
  { ext: '.png', type: 'image/png', desc: 'PNG Image' },
  { ext: '.jpg', type: 'image/jpeg', desc: 'JPEG Image' },
  { ext: '.txt', type: 'text/plain', desc: 'Plain Text' },
  { ext: '.csv', type: 'text/csv', desc: 'Comma Separated Values' },
  { ext: '.html', type: 'text/html', desc: 'HTML Document' },
]

const sqlSnippets = [
  // --- DDL (Data Definition) ---
  { 
    title: 'Create Table (Complete)', 
    code: `CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT='用户表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;` 
  },
  { 
    title: 'Add Column (Alter)', 
    code: `ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) COMMENT '手机号' AFTER email;` 
  },
  { 
    title: 'Modify Column (Alter)', 
    code: `ALTER TABLE users 
MODIFY COLUMN username VARCHAR(100) NOT NULL COMMENT '用户名(扩容)';` 
  },
  { 
    title: 'Rename Column (Change)', 
    code: `ALTER TABLE users 
CHANGE COLUMN phone mobile VARCHAR(20) COMMENT '手机号(重命名)';` 
  },
  { 
    title: 'Drop Column', 
    code: `ALTER TABLE users DROP COLUMN mobile;` 
  },
  
  // --- Indexes ---
  {
    title: 'Create Index',
    code: `CREATE INDEX idx_username ON users(username);`
  },
  {
    title: 'Create Unique Index',
    code: `CREATE UNIQUE INDEX idx_email ON users(email);`
  },
  {
    title: 'Add Index (Alter)',
    code: `ALTER TABLE users ADD INDEX idx_status (status);`
  },
  {
    title: 'Drop Index',
    code: `DROP INDEX idx_username ON users;`
  },

  // --- DML (Data Manipulation) ---
  { 
    title: 'Insert Data', 
    code: `INSERT INTO users (username, email) 
VALUES ('john_doe', 'john@example.com');` 
  },
  {
    title: 'Batch Insert',
    code: `INSERT INTO users (username, email) VALUES 
('user1', 'u1@test.com'),
('user2', 'u2@test.com');`
  },
  { 
    title: 'Update Data', 
    code: `UPDATE users 
SET email = 'new_email@example.com', status = 1 
WHERE id = 1;` 
  },
  { 
    title: 'Delete Data', 
    code: `DELETE FROM users WHERE id = 1;` 
  },
  {
    title: 'Truncate Table',
    code: `TRUNCATE TABLE users; -- 清空表并重置自增ID`
  },

  // --- DQL (Query) ---
  {
    title: 'Select with Join',
    code: `SELECT u.username, o.order_no 
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
WHERE u.status = 1;`
  },
  {
    title: 'Group By & Having',
    code: `SELECT status, COUNT(*) as cnt 
FROM users 
GROUP BY status 
HAVING cnt > 10;`
  },
  
  // --- Advanced ---
  { 
    title: 'Date Functions (MySQL)', 
    code: `-- 格式化: 2023-01-01 12:00:00
DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')

-- 计算: 7天前
DATE_SUB(NOW(), INTERVAL 7 DAY)` 
  },
  {
    title: 'Transactions',
    code: `START TRANSACTION;
INSERT INTO users ...;
UPDATE accounts ...;
COMMIT; -- 或 ROLLBACK;`
  },
  {
    title: 'User Management',
    code: `CREATE USER 'app_user'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON mydb.* TO 'app_user'@'%';
FLUSH PRIVILEGES;`
  }
]

const linuxCommands = [
  // Network & Ports
  { cmd: 'lsof -i :8080', desc: '查看 8080 端口占用情况' },
  { cmd: 'netstat -tulpn', desc: '查看所有监听端口及对应进程' },
  { cmd: 'netstat -anp | grep 8080', desc: '查看指定端口(8080)占用' },
  { cmd: 'ss -tuln', desc: '查看监听端口 (比 netstat 快)' },
  { cmd: 'ip addr', desc: '查看 IP 地址信息' },

  // System Info
  { cmd: 'uname -a', desc: '查看内核/系统版本信息' },
  { cmd: 'cat /etc/os-release', desc: '查看发行版详细信息' },
  { cmd: 'cat /proc/version', desc: '查看内核版本' },
  { cmd: 'uptime', desc: '查看系统运行时间及负载' },

  // CPU
  { cmd: 'top', desc: '实时显示系统进程及资源占用' },
  { cmd: 'lscpu', desc: '查看 CPU 架构信息' },
  { cmd: 'cat /proc/cpuinfo', desc: '查看 CPU 详细信息' },
  
  // Memory
  { cmd: 'free -h', desc: '查看内存使用情况 (人类可读)' },
  { cmd: 'cat /proc/meminfo', desc: '查看内存详细信息' },

  // Disk & Filesystem
  { cmd: 'df -h', desc: '查看磁盘空间使用情况' },
  { cmd: 'du -sh *', desc: '查看当前目录下各文件/目录大小' },
  { cmd: 'fdisk -l', desc: '查看磁盘分区信息' },
  { cmd: 'lsblk', desc: '查看块设备信息' },

  // Process Management
  { cmd: 'ps aux | grep java', desc: '查找 Java 进程' },
  { cmd: 'ps -ef | grep <name>', desc: '查找指定名称的进程' },
  { cmd: 'kill -9 <pid>', desc: '强制杀死进程' },
  { cmd: 'killall <process_name>', desc: '根据进程名杀死进程' },
  
  // File & Directory
  { cmd: 'ls -lah', desc: '列出所有文件（含隐藏）及详细信息' },
  { cmd: 'chmod 755 file', desc: '修改文件权限 (rwxr-xr-x)' },
  { cmd: 'chown user:group file', desc: '修改文件所有者和组' },
  { cmd: 'cp -r source dest', desc: '递归复制目录' },
  { cmd: 'find / -name "*.log"', desc: '全盘查找 .log 结尾的文件' },
  
  // Compression
  { cmd: 'tar -czvf archive.tar.gz dir/', desc: '压缩目录为 .tar.gz' },
  { cmd: 'tar -xzvf archive.tar.gz', desc: '解压 .tar.gz 文件' },
  { cmd: 'zip -r archive.zip dir/', desc: '压缩目录为 .zip' },
  { cmd: 'unzip archive.zip', desc: '解压 .zip 文件' },
  
  // Logs & Text
  { cmd: 'tail -f error.log', desc: '实时查看日志文件末尾' },
  { cmd: 'grep "error" file.log', desc: '在文件中搜索字符串' },
  
  // Transfer
  { cmd: 'scp local_file user@host:/path', desc: '远程拷贝文件 (上传)' },
  { cmd: 'wget <url>', desc: '下载文件' },
]

const powershellCommands = [
  { cmd: 'Get-ChildItem', alias: 'ls, dir', desc: '列出目录内容' },
  { cmd: 'New-Item -Type File "name.txt"', alias: 'touch (unix)', desc: '创建新文件' },
  { cmd: 'Get-Content "file.txt"', alias: 'cat', desc: '查看文件内容' },
  { cmd: 'Select-String "pattern" file.txt', alias: 'grep (unix)', desc: '在文件中查找字符串' },
  { cmd: 'Get-Process', alias: 'ps', desc: '获取进程列表' },
  { cmd: 'Stop-Process -Id <id>', alias: 'kill', desc: '停止进程' },
  { cmd: 'Invoke-WebRequest <url>', alias: 'curl, wget', desc: '发送 HTTP 请求' },
  { cmd: 'Get-Service', alias: 'gsv', desc: '获取服务列表' },
  { cmd: 'Test-NetConnection -Port 80', alias: 'tnc', desc: '测试网络连接/端口' },
  { cmd: 'Get-History', alias: 'h', desc: '查看命令历史' },
]

const httpStatusCodes = [
  // 1xx
  { code: 100, reason: 'Continue', desc: '继续。客户端应继续其请求' },
  { code: 101, reason: 'Switching Protocols', desc: '切换协议。服务器根据客户端的请求切换协议' },
  
  // 2xx
  { code: 200, reason: 'OK', desc: '请求成功。一般用于 GET 与 POST 请求' },
  { code: 201, reason: 'Created', desc: '已创建。成功请求并创建了新的资源' },
  { code: 202, reason: 'Accepted', desc: '已接受。已经接受请求，但未处理完成' },
  { code: 204, reason: 'No Content', desc: '无内容。服务器成功处理，但未返回内容' },
  
  // 3xx
  { code: 301, reason: 'Moved Permanently', desc: '永久移动。请求的资源已被永久的移动到新URI' },
  { code: 302, reason: 'Found', desc: '临时移动。资源只是临时被移动。客户端应继续使用原有URI' },
  { code: 304, reason: 'Not Modified', desc: '未修改。所请求的资源未修改，服务器返回此状态码时，不会返回任何资源' },
  
  // 4xx
  { code: 400, reason: 'Bad Request', desc: '客户端请求的语法错误，服务器无法理解', solution: '检查请求参数格式、类型是否正确' },
  { code: 401, reason: 'Unauthorized', desc: '请求要求用户的身份认证', solution: '检查 Token 是否过期或缺失' },
  { code: 403, reason: 'Forbidden', desc: '服务器理解请求客户端的请求，但是拒绝执行此请求', solution: '检查权限，确认是否有访问该资源的权限' },
  { code: 404, reason: 'Not Found', desc: '服务器无法根据客户端的请求找到资源（网页）', solution: '检查 URL 拼写，确认资源是否存在' },
  { code: 405, reason: 'Method Not Allowed', desc: '客户端请求中的方法被禁止', solution: '检查 HTTP 方法 (GET/POST/PUT/DELETE) 是否匹配接口定义' },
  { code: 408, reason: 'Request Timeout', desc: '服务器等待客户端发送的请求时间过长，超时', solution: '检查网络连接，或增加超时时间' },
  { code: 415, reason: 'Unsupported Media Type', desc: '服务器无法处理请求附带的媒体格式', solution: '检查 Content-Type 头，如 application/json' },
  { code: 429, reason: 'Too Many Requests', desc: '客户端请求次数过多', solution: '降低请求频率，检查是否触发限流' },
  
  // 5xx
  { code: 500, reason: 'Internal Server Error', desc: '服务器内部错误，无法完成请求', solution: '检查服务器日志，查找代码异常或配置错误' },
  { code: 502, reason: 'Bad Gateway', desc: '作为网关或者代理工作的服务器尝试执行请求时，从远程服务器接收到了一个无效的响应', solution: '检查后端服务是否启动，Nginx/网关配置是否正确' },
  { code: 503, reason: 'Service Unavailable', desc: '由于超载或系统维护，服务器暂时的无法处理客户端的请求', solution: '稍后重试，检查服务器负载' },
  { code: 504, reason: 'Gateway Timeout', desc: '充当网关或代理的服务器，未及时从远端服务器获取请求', solution: '检查后端服务处理时间，优化数据库查询或增加超时设置' },
]

// --- Logic ---

const filteredMimeTypes = computed(() => {
  if (!searchQuery.value) return mimeTypes
  const q = searchQuery.value.toLowerCase()
  return mimeTypes.filter(item => 
    item.ext.includes(q) || 
    item.desc.toLowerCase().includes(q) || 
    item.type.toLowerCase().includes(q)
  )
})

const filteredHttpStatusCodes = computed(() => {
  if (!searchQuery.value) return httpStatusCodes
  const q = searchQuery.value.toLowerCase()
  return httpStatusCodes.filter(item => 
    item.code.toString().includes(q) || 
    item.reason.toLowerCase().includes(q) || 
    item.desc.toLowerCase().includes(q) ||
    (item.solution && item.solution.toLowerCase().includes(q))
  )
})

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="h-full flex flex-col text-[var(--text-primary)]">
    <el-tabs v-model="activeTab" class="h-full flex flex-col">
      
      <!-- 1. Escaping -->
      <el-tab-pane label="转义字符 (XML/MyBatis)" name="escape">
        <div class="p-4 h-full overflow-auto">
          <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  <th class="p-3 font-semibold">转义字符</th>
                  <th class="p-3 font-semibold">原始字符</th>
                  <th class="p-3 font-semibold">说明</th>
                  <th class="p-3 font-semibold w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in escapeChars" :key="item.char" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td class="p-3 font-mono text-blue-500">{{ item.char }}</td>
                  <td class="p-3 font-mono">{{ item.origin }}</td>
                  <td class="p-3 text-gray-500 dark:text-gray-400">{{ item.desc }}</td>
                  <td class="p-3">
                    <el-button link type="primary" :icon="CopyDocument" @click="copyText(item.char)"></el-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 2. MIME Types -->
      <el-tab-pane label="文件类型 (MIME)" name="mime">
        <div class="p-4 h-full flex flex-col gap-4">
          <div class="w-full max-w-md">
            <el-input v-model="searchQuery" placeholder="搜索后缀、类型或描述..." :prefix-icon="Search" clearable />
          </div>
          <div class="flex-1 overflow-auto bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <table class="w-full text-left border-collapse">
              <thead class="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] sticky top-0">
                <tr>
                  <th class="p-3 font-semibold w-24">后缀</th>
                  <th class="p-3 font-semibold">MIME Type</th>
                  <th class="p-3 font-semibold">描述</th>
                  <th class="p-3 font-semibold w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredMimeTypes" :key="item.ext" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td class="p-3 font-bold">{{ item.ext }}</td>
                  <td class="p-3 font-mono text-sm text-green-600 dark:text-green-400">{{ item.type }}</td>
                  <td class="p-3 text-gray-500 dark:text-gray-400">{{ item.desc }}</td>
                  <td class="p-3">
                    <el-button link type="primary" :icon="CopyDocument" @click="copyText(item.type)"></el-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-tab-pane>

      <!-- HTTP Status Codes -->
      <el-tab-pane label="HTTP 状态码" name="http">
        <div class="p-4 h-full flex flex-col gap-4">
          <div class="w-full max-w-md">
            <el-input v-model="searchQuery" placeholder="搜索状态码、含义或解决方案..." :prefix-icon="Search" clearable />
          </div>
          <div class="flex-1 overflow-auto bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <table class="w-full text-left border-collapse">
              <thead class="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] sticky top-0">
                <tr>
                  <th class="p-3 font-semibold w-20">Code</th>
                  <th class="p-3 font-semibold w-40">Reason</th>
                  <th class="p-3 font-semibold">中文解释</th>
                  <th class="p-3 font-semibold">建议解决方案</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredHttpStatusCodes" :key="item.code" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td class="p-3 font-bold font-mono" :class="{
                    'text-green-600': item.code >= 200 && item.code < 300,
                    'text-blue-600': item.code >= 300 && item.code < 400,
                    'text-orange-500': item.code >= 400 && item.code < 500,
                    'text-red-600': item.code >= 500
                  }">{{ item.code }}</td>
                  <td class="p-3 font-mono text-sm">{{ item.reason }}</td>
                  <td class="p-3 text-gray-600 dark:text-gray-300">{{ item.desc }}</td>
                  <td class="p-3 text-sm text-gray-500 dark:text-gray-400">
                    <span v-if="item.solution" class="text-orange-600 dark:text-orange-400">{{ item.solution }}</span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 3. SQL Syntax -->
      <el-tab-pane label="SQL 语法" name="sql">
        <div class="p-4 h-full overflow-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="(snippet, index) in sqlSnippets" :key="index" class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold text-lg">{{ snippet.title }}</h3>
              <el-button type="primary" link :icon="CopyDocument" @click="copyText(snippet.code)">复制</el-button>
            </div>
            <pre class="bg-[var(--bg-primary)] p-3 rounded-md text-sm font-mono overflow-x-auto text-gray-700 dark:text-gray-300">{{ snippet.code }}</pre>
          </div>
        </div>
      </el-tab-pane>

      <!-- 4. Linux Commands -->
      <el-tab-pane label="Linux 命令" name="linux">
        <div class="p-4 h-full overflow-auto">
          <div class="grid grid-cols-1 gap-3">
             <div v-for="(cmd, index) in linuxCommands" :key="index" class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-3 flex justify-between items-center hover:bg-[var(--bg-tertiary)] transition-colors">
                <div class="flex-1">
                   <div class="font-mono text-blue-600 dark:text-blue-400 font-bold mb-1">$ {{ cmd.cmd }}</div>
                   <div class="text-sm text-gray-500 dark:text-gray-400">{{ cmd.desc }}</div>
                </div>
                <el-button type="primary" link :icon="CopyDocument" @click="copyText(cmd.cmd)"></el-button>
             </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 5. PowerShell -->
      <el-tab-pane label="PowerShell" name="powershell">
        <div class="p-4 h-full overflow-auto">
           <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden">
            <table class="w-full text-left border-collapse">
              <thead class="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  <th class="p-3 font-semibold">命令 (Cmdlet)</th>
                  <th class="p-3 font-semibold">常用别名</th>
                  <th class="p-3 font-semibold">描述</th>
                  <th class="p-3 font-semibold w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in powershellCommands" :key="item.cmd" class="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td class="p-3 font-mono text-purple-600 dark:text-purple-400 font-bold">{{ item.cmd }}</td>
                  <td class="p-3 font-mono text-sm">{{ item.alias }}</td>
                  <td class="p-3 text-gray-500 dark:text-gray-400">{{ item.desc }}</td>
                  <td class="p-3">
                    <el-button link type="primary" :icon="CopyDocument" @click="copyText(item.cmd)"></el-button>
                  </td>
                </tr>
              </tbody>
            </table>
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
:deep(.el-tabs__item) {
  color: var(--text-primary);
}
:deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
}
</style>