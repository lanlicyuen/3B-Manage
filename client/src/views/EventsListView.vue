<template>
  <div class="events-list-view">
    <header>
      <h1>📅 查看事件</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="filters">
      <div class="filter-group">
        <label>搜索标题：</label>
        <input 
          v-model="filters.query" 
          placeholder="输入关键词..."
          @input="loadEvents"
        >
      </div>
      
      <div class="filter-group">
        <label>开始日期：</label>
        <input type="date" v-model="filters.from" @change="loadEvents">
      </div>
      
      <div class="filter-group">
        <label>结束日期：</label>
        <input type="date" v-model="filters.to" @change="loadEvents">
      </div>
      
      <button @click="resetFilters" class="reset-btn">重置</button>
    </div>

    <div class="loading" v-if="loading">加载中...</div>
    
    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    
    <div class="events-table" v-else-if="!loading">
      <div class="total-count">共 {{ events.length }} 个事件</div>
      
      <table v-if="events.length > 0">
        <thead>
          <tr>
            <th>日期</th>
            <th>标题</th>
            <th>任务</th>
            <th>备注</th>
            <th>参与人数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.date }}</td>
            <td class="title">{{ event.title }}</td>
            <td>{{ event.task || '-' }}</td>
            <td class="remark">{{ event.remark || '-' }}</td>
            <td class="center">{{ event.member_count }}</td>
            <td class="actions">
              <button @click="viewDetail(event.id)" class="view-btn">
                查看详情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="no-data" v-else>
        暂无事件数据
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');
const events = ref([]);

const filters = ref({
  query: '',
  from: '',
  to: ''
});

const loadEvents = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    events.value = await api.getEventsList(
      filters.value.from,
      filters.value.to,
      filters.value.query
    );
  } catch (error) {
    console.error('加载事件列表失败:', error);
    errorMessage.value = `加载失败: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.value = {
    query: '',
    from: '',
    to: ''
  };
  loadEvents();
};

const viewDetail = (id) => {
  router.push(`/events/${id}`);
};

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.events-list-view {
  padding: 20px;
  max-width: 1400px;
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

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 14px;
  color: #666;
  font-weight: bold;
}

.filter-group input {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.reset-btn {
  padding: 8px 20px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn:hover {
  background-color: #f57c00;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #666;
}

.error-message {
  padding: 15px;
  margin-bottom: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
}

.events-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.total-count {
  padding: 15px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-weight: bold;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #424242;
  color: white;
}

th {
  padding: 12px;
  text-align: left;
  font-weight: bold;
}

tbody tr {
  border-bottom: 1px solid #e0e0e0;
}

tbody tr:hover {
  background-color: #f9f9f9;
}

td {
  padding: 12px;
}

td.title {
  font-weight: bold;
  color: #1976d2;
}

td.remark {
  color: #666;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

td.center {
  text-align: center;
  font-weight: bold;
  color: #4caf50;
}

td.actions {
  text-align: center;
}

.view-btn {
  padding: 6px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.view-btn:hover {
  background-color: #1565c0;
}

.no-data {
  padding: 50px;
  text-align: center;
  color: #999;
  font-size: 16px;
}
</style>
