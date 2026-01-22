<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps<{
  title?: string;
  message?: string;
}>();

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/home');
  }
};
</script>

<template>
  <div class="access-denied-wrapper">
    <div class="card">
      <div class="icon-circle">
        <span class="lock-icon">🔒</span>
      </div>
      
      <h1>{{ title || 'Access Denied' }}</h1>
      <p class="subtitle">
        {{ message || 'You do not have the required permissions to view this resource.' }}
      </p>

      <div class="role-check-hint">
        <small>Role required: <strong>USER</strong> or <strong>ADMIN</strong></small>
      </div>

      <div class="actions">
        <button @click="goBack" class="btn secondary">Go Back</button>
        <router-link to="/home" class="btn primary">Return to Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.access-denied-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 50vh; /* Takes up space but fits inside other layouts */
  background-color: #f8f9fa;
  border-radius: 8px;
}

.card {
  text-align: center;
  max-width: 450px;
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #eaeaea;
}

.icon-circle {
  width: 64px;
  height: 64px;
  background: #fff5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.lock-icon {
  font-size: 32px;
}

h1 {
  color: #2d3748;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.role-check-hint {
  background-color: #ebf8ff;
  color: #2b6cb0;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 2rem;
  display: inline-block;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn.primary {
  background: #007bff;
  color: white;
  border: 1px solid #007bff;
}

.btn.primary:hover {
  background: #0056b3;
}

.btn.secondary {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.btn.secondary:hover {
  background: #f7fafc;
  border-color: #a0aec0;
}
</style>