<template>
  <div class="report-view">
    <header>
      <h1>📈 报表导出</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="stats-section">
      <h2>统计信息</h2>
      <div class="loading" v-if="loadingStats">加载中...</div>
      <div v-else class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalMembers }}</div>
          <div class="stat-label">成员总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalEvents }}</div>
          <div class="stat-label">事件总数</div>
        </div>
      </div>
    </div>

    <div class="task-participation-section">
      <h2>📊 成员参与统计汇总</h2>
      <p class="section-desc">一眼看出每个成员参与各任务的次数和总参与次数</p>
      
      <div class="task-filter-form">
        <div class="form-group">
          <label>起始日期</label>
          <input type="date" v-model="memberSummaryFilters.from">
        </div>
        
        <div class="form-group">
          <label>结束日期</label>
          <input type="date" v-model="memberSummaryFilters.to">
        </div>
        
        <button @click="loadMemberSummary" class="export-btn">
          🔍 查询统计
        </button>
        
        <button @click="exportMemberSummary" class="export-btn" :disabled="memberSummaryData.length === 0">
          📥 导出CSV
        </button>
        
        <button @click="saveMemberSummaryImage" class="export-btn" :disabled="memberSummaryData.length === 0">
          📷 保存统计图片
        </button>
      </div>

      <div class="loading" v-if="loadingMemberSummary">加载中...</div>
      <div v-else-if="memberSummaryData.length === 0" class="empty">
        暂无统计数据，请选择日期范围后查询
      </div>
      <div v-else class="member-summary-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>成员姓名</th>
              <th v-for="task in allTaskNames" :key="task" class="task-col">
                {{ task }}
              </th>
              <th class="total-col">总参与次数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in memberSummaryData" :key="member.member_id">
              <td>{{ String(member.member_id).padStart(3, '0') }}</td>
              <td class="member-name-cell">{{ member.member_name }}</td>
              <td v-for="task in allTaskNames" :key="task" class="count-cell">
                <span v-if="member.tasks[task]" class="count-badge">
                  {{ member.tasks[task] }}
                </span>
                <span v-else class="no-count">-</span>
              </td>
              <td class="total-cell">
                <span class="total-badge">{{ member.total_count }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary-note">
          💡 统计范围：{{ memberSummaryFilters.from }} 至 {{ memberSummaryFilters.to }} 
          | 共 {{ memberSummaryData.length }} 名成员
        </div>
      </div>
    </div>

    <div class="task-participation-section">
      <h2>📊 任务参与统计</h2>
      <div class="task-filter-form">
        <div class="form-group">
          <label>起始日期</label>
          <input type="date" v-model="taskFilters.from">
        </div>
        
        <div class="form-group">
          <label>结束日期</label>
          <input type="date" v-model="taskFilters.to">
        </div>
        
        <div class="form-group">
          <label>任务类型</label>
          <select v-model="taskFilters.taskName">
            <option value="">全部任务</option>
            <option v-for="task in allTasks" :key="task.id" :value="task.name">
              {{ task.name }} ({{ task.category }})
            </option>
          </select>
        </div>
        
        <button @click="loadTaskParticipation" class="export-btn">
          🔍 查询统计
        </button>
        
        <button @click="exportTaskParticipation" class="export-btn" :disabled="taskParticipationStats.length === 0">
          📥 导出CSV
        </button>
        
        <button @click="saveTaskStatsImage" class="export-btn" :disabled="taskParticipationStats.length === 0">
          📷 保存统计图片
        </button>
      </div>

      <div class="loading" v-if="loadingTaskStats">加载中...</div>
      <div v-else-if="taskParticipationStats.length === 0" class="empty">
        暂无统计数据，请选择日期范围后查询
      </div>
      <div v-else class="task-stats-table">
        <table>
          <thead>
            <tr>
              <th>任务</th>
              <th>成员</th>
              <th>参与次数</th>
              <th>首次参与</th>
              <th>最近参与</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in taskParticipationStats" :key="`${stat.task}-${stat.member_id}`">
              <td><strong>{{ stat.task }}</strong></td>
              <td>{{ stat.member_name }}</td>
              <td><span class="count-badge">{{ stat.participation_count }}</span></td>
              <td>{{ stat.first_date }}</td>
              <td>{{ stat.last_date }}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary-note">
          💡 共 {{ taskParticipationStats.length }} 条记录
        </div>
      </div>
    </div>

    <div class="preview-section">
      <h2>近期事件预览</h2>
      <div class="loading" v-if="loadingEvents">加载中...</div>
      <div v-else-if="events.length === 0" class="empty">
        暂无事件记录
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>日期</th>
            <th>标题</th>
            <th>任务</th>
            <th>参与人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.id }}</td>
            <td>{{ event.date }}</td>
            <td><strong>{{ event.title }}</strong></td>
            <td>{{ event.task || '-' }}</td>
            <td>{{ event.memberCount || 0 }}</td>
            <td>
              <button 
                class="view-btn" 
                @click="$router.push(`/events/${event.id}`)"
              >
                查看
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from '../api';

const loadingStats = ref(true);
const loadingEvents = ref(true);
const loadingTaskStats = ref(false);
const loadingMemberSummary = ref(false);
const stats = ref({
  totalMembers: 0,
  totalEvents: 0
});
const events = ref([]);
const allMembers = ref([]);
const allTasks = ref([]);
const memberSearchQuery = ref('');
const showMemberSelector = ref(false);
const filters = ref({
  from: '',
  to: '',
  titleLike: '',
  memberIds: []
});

// 任务参与统计过滤器
const taskFilters = ref({
  from: '',
  to: '',
  taskName: ''
});

const taskParticipationStats = ref([]);

// 成员汇总统计过滤器
const memberSummaryFilters = ref({
  from: '',
  to: ''
});

const memberSummaryRawData = ref([]);

// 处理成员汇总数据
const memberSummaryData = computed(() => {
  if (memberSummaryRawData.value.length === 0) return [];
  
  // 按成员分组
  const memberMap = new Map();
  
  memberSummaryRawData.value.forEach(record => {
    if (!memberMap.has(record.member_id)) {
      memberMap.set(record.member_id, {
        member_id: record.member_id,
        member_name: record.member_name,
        tasks: {},
        total_count: 0
      });
    }
    
    const member = memberMap.get(record.member_id);
    member.tasks[record.task] = record.task_count;
    member.total_count += record.task_count;
  });
  
  return Array.from(memberMap.values()).sort((a, b) => {
    // 按总参与次数降序排序
    return b.total_count - a.total_count;
  });
});

// 获取所有任务名称（作为表头）
const allTaskNames = computed(() => {
  const taskSet = new Set();
  memberSummaryRawData.value.forEach(record => {
    taskSet.add(record.task);
  });
  return Array.from(taskSet).sort();
});

// 过滤成员选择器中的成员
const filteredMembersForSelect = computed(() => {
  if (!memberSearchQuery.value) {
    return allMembers.value;
  }
  
  const query = memberSearchQuery.value.toLowerCase();
  return allMembers.value.filter(m => 
    m.name.toLowerCase().includes(query) || 
    String(m.id).includes(query)
  );
});

// 全选成员
const selectAllMembers = () => {
  filters.value.memberIds = filteredMembersForSelect.value.map(m => m.id);
};

// 清空成员选择
const clearAllMembers = () => {
  filters.value.memberIds = [];
};

// 加载成员列表
const loadMembers = async () => {
  try {
    allMembers.value = await api.getMembers();
  } catch (error) {
    console.error('加载成员失败:', error);
  }
};

// 加载任务列表
const loadTasks = async () => {
  try {
    allTasks.value = await api.getTasks();
  } catch (error) {
    console.error('加载任务失败:', error);
  }
};

// 加载统计信息
const loadStats = async () => {
  loadingStats.value = true;
  try {
    stats.value = await api.getStats();
  } catch (error) {
    console.error('加载统计失败:', error);
  } finally {
    loadingStats.value = false;
  }
};

// 加载近期事件
const loadRecentEvents = async () => {
  loadingEvents.value = true;
  try {
    // 获取最近 30 天的事件
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    
    const rows = await api.getEvents(from, to);
    
    // 按event_id分组统计
    const eventMap = new Map();
    rows.forEach(row => {
      if (!eventMap.has(row.event_id)) {
        eventMap.set(row.event_id, {
          id: row.event_id,
          date: row.date,
          title: row.title,
          task: row.task,
          memberCount: 0
        });
      }
      if (row.member_id) {
        eventMap.get(row.event_id).memberCount++;
      }
    });
    
    events.value = Array.from(eventMap.values());
  } catch (error) {
    console.error('加载事件失败:', error);
  } finally {
    loadingEvents.value = false;
  }
};

// 导出 CSV
const exportCsv = async () => {
  try {
    await api.exportCsv(
      filters.value.from, 
      filters.value.to, 
      filters.value.titleLike,
      filters.value.memberIds
    );
  } catch (error) {
    console.error('导出失败:', error);
    alert(`导出失败: ${error.message}`);
  }
};

// 清除筛选
const clearFilter = () => {
  filters.value = {
    from: '',
    to: '',
    titleLike: '',
    memberIds: []
  };
};

// 加载任务参与统计
const loadTaskParticipation = async () => {
  if (!taskFilters.value.from || !taskFilters.value.to) {
    alert('请选择起始和结束日期');
    return;
  }
  
  loadingTaskStats.value = true;
  try {
    const params = new URLSearchParams();
    params.append('from', taskFilters.value.from);
    params.append('to', taskFilters.value.to);
    if (taskFilters.value.taskName) {
      params.append('taskName', taskFilters.value.taskName);
    }
    
    const token = localStorage.getItem('admin_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`/api/reports/task-participation?${params}`, { headers });
    if (!res.ok) {
      throw new Error('获取统计失败');
    }
    taskParticipationStats.value = await res.json();
  } catch (error) {
    console.error('加载任务统计失败:', error);
    alert(`加载任务统计失败: ${error.message}`);
  } finally {
    loadingTaskStats.value = false;
  }
};

// 加载成员参与汇总统计
const loadMemberSummary = async () => {
  if (!memberSummaryFilters.value.from || !memberSummaryFilters.value.to) {
    alert('请选择起始和结束日期');
    return;
  }
  
  loadingMemberSummary.value = true;
  try {
    memberSummaryRawData.value = await api.getMemberParticipationSummary(
      memberSummaryFilters.value.from,
      memberSummaryFilters.value.to
    );
  } catch (error) {
    console.error('加载成员汇总统计失败:', error);
    alert(`加载成员汇总统计失败: ${error.message}`);
  } finally {
    loadingMemberSummary.value = false;
  }
};

// 导出成员汇总统计CSV
const exportMemberSummary = async () => {
  if (!memberSummaryFilters.value.from || !memberSummaryFilters.value.to) {
    alert('请选择起始和结束日期');
    return;
  }
  
  try {
    await api.exportMemberSummaryCsv(
      memberSummaryFilters.value.from,
      memberSummaryFilters.value.to
    );
  } catch (error) {
    console.error('导出失败:', error);
    alert(`导出失败: ${error.message}`);
  }
};

// 导出任务参与统计CSV
const exportTaskParticipation = async () => {
  if (!taskFilters.value.from || !taskFilters.value.to) {
    alert('请选择起始和结束日期');
    return;
  }
  
  try {
    await api.exportTaskParticipationCsv(
      taskFilters.value.from,
      taskFilters.value.to,
      taskFilters.value.taskName
    );
  } catch (error) {
    console.error('导出失败:', error);
    alert(`导出失败: ${error.message}`);
  }
};

// 保存成员汇总统计图片
const saveMemberSummaryImage = async () => {
  try {
    const element = document.querySelector('.member-summary-table');
    if (!element) {
      alert('未找到统计表格');
      return;
    }
    
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const link = document.createElement('a');
    link.download = `member_summary_${memberSummaryFilters.value.from}_${memberSummaryFilters.value.to}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (error) {
    console.error('保存图片失败:', error);
    alert(`保存图片失败: ${error.message}`);
  }
};

// 保存任务参与统计图片
const saveTaskStatsImage = async () => {
  try {
    const element = document.querySelector('.task-stats-table');
    if (!element) {
      alert('未找到统计表格');
      return;
    }
    
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const link = document.createElement('a');
    link.download = `task_participation_${taskFilters.value.from}_${taskFilters.value.to}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (error) {
    console.error('保存图片失败:', error);
    alert(`保存图片失败: ${error.message}`);
  }
};

onMounted(() => {
  loadStats();
  loadRecentEvents();
  loadMembers();
  loadTasks();
  
  // 设置默认日期范围（最近30天）
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  taskFilters.value.from = from;
  taskFilters.value.to = to;
  memberSummaryFilters.value.from = from;
  memberSummaryFilters.value.to = to;
});
</script>

<style scoped>
.report-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

header h1 {
  margin: 0;
  color: #333;
}

header button {
  padding: 10px 20px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

header button:hover {
  background-color: #616161;
}

.export-section, .stats-section, .preview-section, .task-participation-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
  border-bottom: none;
  padding-bottom: 0;
}

.task-participation-section > h2 {
  border-bottom: 2px solid #1976d2;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.stats-section > h2,
.export-section > h2 {
  border-bottom: 2px solid #1976d2;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.filter-form, .task-filter-form {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  margin-top: 20px;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.full-width {
  flex: 1 1 100%;
}

.form-group label {
  color: #666;
  font-weight: bold;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.member-select-box {
  position: relative;
}

.member-select-box > input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.member-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 5px;
  background: white;
  border: 2px solid #1976d2;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-actions {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.dropdown-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.dropdown-actions button:nth-child(1) {
  background-color: #4caf50;
  color: white;
}

.dropdown-actions button:nth-child(2) {
  background-color: #ff9800;
  color: white;
}

.dropdown-actions button:nth-child(3) {
  background-color: #757575;
  color: white;
}

.member-list {
  overflow-y: auto;
  max-height: 300px;
  padding: 10px;
}

.member-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.member-checkbox:hover {
  background-color: #f5f5f5;
}

.member-checkbox input {
  width: auto;
  cursor: pointer;
}

.selected-members {
  margin-top: 10px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
  font-weight: bold;
}

.export-btn {
  padding: 10px 25px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.export-btn:hover {
  background-color: #45a049;
}

.clear-btn {
  padding: 10px 20px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background-color: #616161;
}

.help-text {
  margin-top: 25px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
}

.help-text p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.help-text ul {
  margin: 0;
  padding-left: 20px;
}

.help-text li {
  margin-bottom: 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.9;
}

.loading, .empty {
  text-align: center;
  padding: 30px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

tr:hover {
  background-color: #f9f9f9;
}

.view-btn {
  padding: 6px 15px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.view-btn:hover {
  background-color: #1565c0;
}

/* 任务参与统计样式 */
.task-stats-table {
  margin-top: 20px;
}

.count-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: #4caf50;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
}

.summary-note {
  margin-top: 15px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
  text-align: center;
  font-size: 14px;
}

.task-participation-section select {
  cursor: pointer;
  min-width: 200px;
}

/* 成员汇总统计样式 */
.section-desc {
  color: #666;
  font-size: 14px;
  margin-top: 0;
  margin-bottom: 15px;
}

.member-summary-table {
  margin-top: 20px;
  overflow-x: auto;
}

.member-summary-table table {
  min-width: 800px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e0e0e0;
}

.member-summary-table th {
  position: sticky;
  top: 0;
  background-color: #1976d2;
  color: white;
  font-weight: bold;
  padding: 12px 8px;
  text-align: center;
  border: 1px solid #1565c0;
  white-space: nowrap;
}

.member-summary-table td {
  padding: 10px 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.member-name-cell {
  text-align: left !important;
  font-weight: 500;
  color: #333;
  min-width: 120px;
}

.task-col {
  background-color: #e3f2fd;
  min-width: 80px;
}

.total-col {
  background-color: #fff3e0;
  font-weight: bold;
}

.count-cell {
  background-color: #f9f9f9;
}

.count-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #4caf50;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 13px;
}

.no-count {
  color: #ccc;
  font-size: 16px;
}

.total-cell {
  background-color: #fff9e6;
}

.total-badge {
  display: inline-block;
  padding: 5px 12px;
  background-color: #ff9800;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
}

.member-summary-table tr:hover td {
  background-color: #f0f7ff;
}
</style>
