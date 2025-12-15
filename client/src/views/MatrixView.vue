<template>
  <div class="matrix-view">
    <header>
      <h1>
        <img src="/brand/logo.png" alt="Logo" class="logo" />
        游戏成员管理系统
      </h1>
      <nav>
        <template v-if="isLoggedIn">
          <button @click="$router.push('/members')">👥 成员管理</button>
          <button @click="$router.push('/events/create')">➕ 创建事件</button>
          <button @click="$router.push('/events')">📅 查看事件</button>
          <button @click="$router.push('/reports')">📈 报表导出</button>
          <button @click="handleLogout" class="logout-btn">🚪 退出</button>
        </template>
        <template v-else>
          <button @click="showLoginModal" class="login-btn">🔐 总督请进</button>
        </template>
      </nav>
    </header>

    <LoginModal 
      v-if="loginModalVisible" 
      @close="loginModalVisible = false"
      @success="handleLoginSuccess"
    />

    <div class="date-range-selector">
      <label>日期范围：</label>
      <button 
        v-for="range in dateRanges" 
        :key="range.days"
        :class="{ active: selectedDays === range.days }"
        @click="changeDateRange(range.days)"
      >
        {{ range.label }}
      </button>
    </div>

    <div class="error-message" v-if="errorMessage">
      ⚠️ {{ errorMessage }}
    </div>

    <div class="loading" v-if="loading">加载中...</div>
    
    <div class="matrix-container" v-else>
      <div class="matrix-header">
        <div class="corner-cell">成员 \ 日期</div>
        <div class="date-cell" v-for="date in dates" :key="date">
          <div class="date-day">{{ formatDate(date).day }}</div>
          <div class="date-month">{{ formatDate(date).month }}</div>
        </div>
      </div>
      
      <div class="matrix-row" v-for="member in members" :key="member.id">
        <div class="member-cell">
          <span class="member-id">{{ String(member.id).padStart(3, '0') }}</span>
          <span class="member-name">{{ member.name }}</span>
        </div>
        
        <MatrixCell 
          v-for="date in dates" 
          :key="`${member.id}-${date}`"
          :events="getEventsForCell(member.id, date)"
          @click="showEventSelection(member.id, date, $event)"
        />
      </div>
    </div>

    <!-- 事件选择弹窗 -->
    <div class="modal" v-if="selectedEvents.length > 0" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ selectedMemberName }} - {{ selectedDate }}</h3>
        <div class="event-list">
          <div 
            class="event-item" 
            v-for="event in selectedEvents" 
            :key="event.event_id"
            @click="viewEvent(event.event_id)"
          >
            <strong>{{ event.title }}</strong>
            <span v-if="event.task">{{ event.task }}</span>
          </div>
        </div>
        <button @click="closeModal">关闭</button>
      </div>
    </div>
    <!-- PWA 安装提示 -->
    <InstallPWA />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import MatrixCell from '../components/MatrixCell.vue';
import LoginModal from '../components/LoginModal.vue';
import InstallPWA from '../components/InstallPWA.vue';

const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');
const members = ref([]);
const eventsData = ref([]);
const selectedEvents = ref([]);
const selectedMemberName = ref('');
const selectedDate = ref('');
const selectedDays = ref(30);
const loginModalVisible = ref(false);
const isLoggedIn = ref(false);

const dateRanges = [
  { days: 7, label: '7天' },
  { days: 14, label: '14天' },
  { days: 30, label: '30天' },
  { days: 60, label: '60天' },
  { days: 90, label: '90天' }
];

// 生成日期列表（从左到右：最新 -> 最旧）
const dates = computed(() => {
  const result = [];
  const today = new Date();
  
  // 从 0 到 range-1，0 代表 today
  for (let i = 0; i < selectedDays.value; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // 确保格式为 YYYY-MM-DD
    result.push(date.toISOString().split('T')[0]);
  }
  
  return result;
});

// 构建事件索引 Map: key = "memberId_date" -> events[]
const eventsMap = computed(() => {
  const map = new Map();
  
  eventsData.value.forEach(row => {
    if (row.member_id && row.date) {
      const key = `${row.member_id}_${row.date}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(row);
    }
  });
  
  return map;
});

// 格式化日期显示（返回day和month用于两行显示）
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.getMonth() + 1
  };
};

// 获取某个单元格的事件（使用索引）
const getEventsForCell = (memberId, date) => {
  const key = `${memberId}_${date}`;
  return eventsMap.value.get(key) || [];
};

// 显示事件选择弹窗
const showEventSelection = (memberId, date, eventList) => {
  if (eventList.length === 0) return;
  
  const member = members.value.find(m => m.id === memberId);
  selectedMemberName.value = member ? member.name : `成员${memberId}`;
  selectedDate.value = date;
  
  if (eventList.length === 1) {
    viewEvent(eventList[0].event_id);
  } else {
    // 去重事件（同一事件可能有多个成员记录）
    const uniqueEvents = [];
    const seenIds = new Set();
    
    eventList.forEach(event => {
      if (!seenIds.has(event.event_id)) {
        seenIds.add(event.event_id);
        uniqueEvents.push(event);
      }
    });
    
    selectedEvents.value = uniqueEvents;
  }
};

// 查看事件详情
const viewEvent = (eventId) => {
  router.push(`/events/${eventId}`);
};

// 关闭弹窗
const closeModal = () => {
  selectedEvents.value = [];
};

// 切换日期范围
const changeDateRange = (days) => {
  selectedDays.value = days;
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    // 加载成员
    members.value = await api.getMembers();
    
    // 加载指定天数的事件
    // dates[0] 是 today，dates[dates.length-1] 是最旧
    const to = dates.value[0];  // 最新日期 (today)
    const from = dates.value[dates.value.length - 1];  // 最旧日期
    eventsData.value = await api.getEvents(from, to);
    
  } catch (error) {
    console.error('加载数据失败:', error);
    errorMessage.value = `加载数据失败: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

// 检查登录状态
const checkLogin = () => {
  isLoggedIn.value = !!localStorage.getItem('admin_token');
};

// 显示登录弹窗
const showLoginModal = () => {
  loginModalVisible.value = true;
};

// 登录成功处理
const handleLoginSuccess = () => {
  isLoggedIn.value = true;
  loginModalVisible.value = false;
};

// 退出登录
const handleLogout = async () => {
  if (!confirm('确定要退出吗？')) return;
  
  try {
    await api.adminLogout();
  } catch (error) {
    console.error('退出失败:', error);
  }
  
  localStorage.removeItem('admin_token');
  isLoggedIn.value = false;
  alert('已退出登录');
};

onMounted(() => {
  checkLogin();
  loadData();
});
</script>

<style scoped>
.matrix-view {
  padding: 20px;
  max-width: 100%;
  overflow-x: auto;
}

header {
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 15px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 .logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

@media (max-width: 768px) {
  h1 .logo {
    width: 32px;
    height: 32px;
  }
}

nav {
  display: flex;
  gap: 10px;
}

nav button {
  padding: 10px 20px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

nav button:hover {
  background-color: #1565c0;
}

.login-btn {
  background-color: #ff9800 !important;
  font-weight: bold;
}

.login-btn:hover {
  background-color: #f57c00 !important;
}

.logout-btn {
  background-color: #757575 !important;
}

.logout-btn:hover {
  background-color: #616161 !important;
}

.date-range-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.date-range-selector label {
  font-weight: bold;
  color: #666;
}

.date-range-selector button {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #333;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.date-range-selector button:hover {
  background-color: #e0e0e0;
}

.date-range-selector button.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.error-message {
  padding: 15px;
  margin-bottom: 20px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  border-left: 4px solid #c62828;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #666;
}

.matrix-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.matrix-header {
  display: flex;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.corner-cell {
  width: 200px;
  min-width: 200px;
  padding: 10px;
  background-color: #424242;
  color: white;
  font-weight: bold;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-cell {
  width: 36px;
  min-width: 36px;
  padding: 5px 2px;
  background-color: #757575;
  color: white;
  font-size: 12px;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.date-day {
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
}

.date-month {
  font-size: 11px;
  color: #e0e0e0;
  line-height: 1;
}

.matrix-row {
  display: flex;
}

.member-cell {
  width: 200px;
  min-width: 200px;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  position: sticky;
  left: 0;
  z-index: 5;
}

.member-id {
  font-family: monospace;
  font-weight: bold;
  color: #666;
}

.member-name {
  color: #333;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.event-list {
  margin: 20px 0;
}

.event-item {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.event-item:hover {
  background-color: #e0e0e0;
}

.event-item strong {
  color: #1976d2;
}

.event-item span {
  color: #666;
  font-size: 14px;
}

.modal-content button {
  padding: 10px 20px;
  background-color: #757575;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-content button:hover {
  background-color: #616161;
}
</style>
