<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <h2>🔐 总督请进</h2>
      <p class="hint">请输入管理密码</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input 
            type="password" 
            v-model="password" 
            placeholder="请输入密码"
            autofocus
            :disabled="loading"
          >
        </div>
        
        <div class="error-message" v-if="errorMessage">
          {{ errorMessage }}
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="loading || !password">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <button type="button" @click="$emit('close')" :disabled="loading">
            取消
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../api';

const emit = defineEmits(['close', 'success']);

const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  if (!password.value) {
    errorMessage.value = '请输入密码';
    return;
  }
  
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const result = await api.adminLogin(password.value);
    localStorage.setItem('admin_token', result.token);
    emit('success');
    emit('close');
  } catch (error) {
    errorMessage.value = error.message || '登录失败';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
}

h2 {
  margin: 0 0 10px 0;
  color: #333;
  text-align: center;
}

.hint {
  margin: 0 0 20px 0;
  color: #666;
  text-align: center;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
}

.error-message {
  padding: 10px;
  margin-bottom: 15px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.form-actions button[type="submit"] {
  background-color: #1976d2;
  color: white;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background-color: #1565c0;
}

.form-actions button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.form-actions button[type="button"] {
  background-color: #757575;
  color: white;
}

.form-actions button[type="button"]:hover:not(:disabled) {
  background-color: #616161;
}
</style>
