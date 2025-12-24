<template>
  <div class="report-view">
    <header>
      <h1>📈 报表导出</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="export-section">
      <h2>导出 CSV 报表</h2>
      
      <div class="filter-form">
        <div class="form-group">
          <label>起始日期</label>
          <input type="date" v-model="filters.from">
        </div>
        
        <div class="form-group">
          <label>结束日期</label>
          <input type="date" v-model="filters.to">
        </div>
        
        <div class="form-group">
          <label>标题关键词</label>
          <input v-model="filters.titleLike" placeholder="例如：公会战">
        </div>
        
        <div class="form-group full-width">
          <label>筛选成员（可多选）</label>
          <div class="member-select-box">
            <input 
              v-model="memberSearchQuery" 
              placeholder="🔍 搜索成员..."
              @focus="showMemberSelector = true"
            >
            <div v-if="showMemberSelector" class="member-dropdown">
              <div class="dropdown-actions">
                <button type="button" @click="selectAllMembers">全选</button>
                <button type="button" @click="clearAllMembers">清空</button>
                <button type="button" @click="showMemberSelector = false">关闭</button>
              </div>
              <div class="member-list">
                <label 
                  v-for="member in filteredMembersForSelect" 
                  :key="member.id"
                  class="member-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :value="member.id" 
                    v-model="filters.memberIds"
                  >
                  <span>{{ String(member.id).padStart(3, '0') }} {{ member.name }}</span>
                </label>
              </div>
            </div>
            <div v-if="filters.memberIds.length > 0" class="selected-members">
              已选择 {{ filters.memberIds.length }} 个成员
            </div>
          </div>
        </div>
        
        <button @click="exportCsv" class="export-btn">
          📥 导出 CSV
        </button>
        
        <button @click="clearFilter" class="clear-btn">
          🔄 清除筛选
        </button>
      </div>

      <div class="help-text">
        <p>💡 提示：</p>
        <ul>
          <li>支持按日期范围、标题关键词、参与成员筛选</li>
          <li>CSV 格式：date,title,task,event_remark,member_id,member_name,member_note</li>
          <li>每一行代表一个成员参与一次事件</li>
          <li>可使用 Excel 或其他表格软件打开</li>
        </ul>
      </div>
    </div>

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
const stats = ref({
  totalMembers: 0,
  totalEvents: 0
});
const events = ref([]);
const allMembers = ref([]);
const memberSearchQuery = ref('');
const showMemberSelector = ref(false);
const filters = ref({
  from: '',
  to: '',
  titleLike: '',
  memberIds: []
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

onMounted(() => {
  loadStats();
  loadRecentEvents();
  loadMembers();
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

.export-section, .stats-section, .preview-section {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

h2 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #1976d2;
  padding-bottom: 10px;
}

.filter-form {
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

.form-group input {
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
</style>
