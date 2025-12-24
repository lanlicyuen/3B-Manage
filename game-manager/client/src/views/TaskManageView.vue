<template>
  <div class="task-manage">
    <header>
      <h1>🎯 任务管理</h1>
      <button @click="$router.push('/')">← 返回首页</button>
    </header>

    <div class="create-section">
      <h2>创建新任务</h2>
      <div class="create-form">
        <div class="form-row">
          <div class="form-group">
            <label>任务名称 *</label>
            <input v-model="newTask.name" placeholder="例如：空城首占" required>
          </div>
          
          <div class="form-group">
            <label>分类</label>
            <input 
              v-model="newTask.category" 
              list="category-suggestions"
              placeholder="输入或选择分类"
            >
            <datalist id="category-suggestions">
              <option value="公会战"></option>
              <option value="副本"></option>
              <option value="活动"></option>
              <option value="日常"></option>
              <option value="其他"></option>
            </datalist>
          </div>
          
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="newTask.sort_order" type="number" placeholder="0">
          </div>
        </div>
        
        <div class="form-group full-width">
          <label>描述</label>
          <input v-model="newTask.description" placeholder="任务描述（可选）">
        </div>
        
        <button @click="createTask" class="create-btn" :disabled="!newTask.name">
          ➕ 创建任务
        </button>
      </div>
    </div>

    <div class="tasks-section">
      <h2>现有任务列表</h2>
      
      <div class="loading" v-if="loading">加载中...</div>
      
      <div v-else-if="tasksByCategory.length === 0" class="empty">
        暂无任务定义
      </div>
      
      <div v-else class="tasks-by-category">
        <div v-for="category in tasksByCategory" :key="category.name" class="category-group">
          <h3>{{ category.name }}</h3>
          <div class="tasks-list">
            <div v-for="task in category.tasks" :key="task.id" class="task-item">
              <div class="task-info">
                <span class="task-name">{{ task.name }}</span>
                <span class="task-desc" v-if="task.description">{{ task.description }}</span>
                <span class="task-order">排序: {{ task.sort_order }}</span>
              </div>
              <div class="task-actions">
                <button @click="editTask(task)" class="edit-btn">编辑</button>
                <button @click="deleteTask(task)" class="delete-btn">删除</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingTask" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h2>编辑任务</h2>
        
        <div class="form-group">
          <label>任务名称 *</label>
          <input v-model="editingTask.name" required>
        </div>
        
        <div class="form-group">
          <label>分类</label>
          <input 
            v-model="editingTask.category" 
            list="category-suggestions"
            placeholder="输入或选择分类"
          >
        </div>
        
        <div class="form-group">
          <label>排序</label>
          <input v-model.number="editingTask.sort_order" type="number">
        </div>
        
        <div class="form-group">
          <label>描述</label>
          <input v-model="editingTask.description">
        </div>
        
        <div class="modal-actions">
          <button @click="saveEdit" class="save-btn">保存</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const loading = ref(true);
const tasks = ref([]);
const editingTask = ref(null);

const newTask = ref({
  name: '',
  category: '公会战',
  description: '',
  sort_order: 0
});

// 按分类组织任务
const tasksByCategory = computed(() => {
  const categoryMap = new Map();
  
  tasks.value.forEach(task => {
    const category = task.category || '其他';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category).push(task);
  });

  return Array.from(categoryMap.entries()).map(([name, tasks]) => ({
    name,
    tasks: tasks.sort((a, b) => a.sort_order - b.sort_order)
  })).sort((a, b) => {
    const order = ['公会战', '副本', '活动', '日常', '其他'];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
});

// 加载任务列表
const loadTasks = async () => {
  loading.value = true;
  try {
    tasks.value = await api.getTasks();
  } catch (error) {
    console.error('加载任务失败:', error);
    alert(`加载任务失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 创建任务
const createTask = async () => {
  if (!newTask.value.name.trim()) {
    alert('请输入任务名称');
    return;
  }

  try {
    await api.createTask({
      name: newTask.value.name.trim(),
      category: newTask.value.category || null,
      description: newTask.value.description.trim() || null,
      sort_order: newTask.value.sort_order || 0
    });
    
    alert('任务创建成功！');
    
    // 重置表单
    newTask.value = {
      name: '',
      category: '公会战',
      description: '',
      sort_order: 0
    };
    
    // 重新加载列表
    await loadTasks();
  } catch (error) {
    console.error('创建任务失败:', error);
    alert(`创建任务失败: ${error.message}`);
  }
};

// 编辑任务
const editTask = (task) => {
  editingTask.value = { ...task };
};

// 保存编辑
const saveEdit = async () => {
  if (!editingTask.value.name.trim()) {
    alert('请输入任务名称');
    return;
  }

  try {
    await api.updateTask(editingTask.value.id, {
      name: editingTask.value.name.trim(),
      category: editingTask.value.category || null,
      description: editingTask.value.description || null,
      sort_order: editingTask.value.sort_order || 0,
      is_active: 1
    });
    
    alert('任务更新成功！');
    editingTask.value = null;
    await loadTasks();
  } catch (error) {
    console.error('更新任务失败:', error);
    alert(`更新任务失败: ${error.message}`);
  }
};

// 取消编辑
const cancelEdit = () => {
  editingTask.value = null;
};

// 删除任务
const deleteTask = async (task) => {
  if (!confirm(`确定要删除任务"${task.name}"吗？\n\n删除后该任务将不再显示在下拉列表中。`)) {
    return;
  }

  try {
    await api.deleteTask(task.id);
    alert('任务已删除');
    await loadTasks();
  } catch (error) {
    console.error('删除任务失败:', error);
    alert(`删除任务失败: ${error.message}`);
  }
};

onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.task-manage {
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

.create-section, .tasks-section {
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

.create-form {
  margin-top: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group.full-width {
  grid-column: 1 / -1;
  margin-bottom: 15px;
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

.create-btn {
  padding: 12px 30px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.create-btn:hover {
  background-color: #45a049;
}

.create-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading, .empty {
  text-align: center;
  padding: 30px;
  color: #666;
}

.tasks-by-category {
  margin-top: 20px;
}

.category-group {
  margin-bottom: 30px;
}

.category-group h3 {
  color: #1976d2;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e0e0e0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.task-item:hover {
  background: #f0f0f0;
  border-color: #1976d2;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.task-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.task-desc {
  color: #666;
  font-size: 14px;
}

.task-order {
  color: #999;
  font-size: 12px;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 6px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976d2;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.save-btn, .cancel-btn {
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background-color: #4caf50;
  color: white;
}

.save-btn:hover {
  background-color: #45a049;
}

.cancel-btn {
  background-color: #757575;
  color: white;
}

.cancel-btn:hover {
  background-color: #616161;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .task-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    width: 100%;
    margin-top: 10px;
  }
}
</style>
