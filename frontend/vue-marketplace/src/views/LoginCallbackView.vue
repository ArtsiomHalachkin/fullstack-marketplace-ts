<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const auth = useAuth();
const statusMessage = ref("Verifying credentials...");

onMounted(async () => {
  try {
    await auth.init();

    const currentUrl = window.location.href;
    await auth.handleCallback(currentUrl);

    statusMessage.value = "Login successful! Redirecting...";
    setTimeout(() => router.push('/home'), 800); 

  } catch (err: any) {
    console.error("Callback Error", err);

    if (!auth.error.value) {
        auth.error.value = "Failed to complete login. The link may have expired.";
    }
  }
});
</script>

<template>
  <div class="callback-container">
    <div class="card">
      <div v-if="auth.error.value" class="state error">
        <h2>Login Failed</h2>
        <p>{{ auth.error.value }}</p>
        <router-link to="/login" class="btn">Return to Login</router-link>
      </div>
      <div v-else class="state loading">
        <div class="spinner"></div>
        <h2>{{ statusMessage }}</h2>
        <p v-if="auth.state.authenticated">Welcome, {{ auth.getUsername() }}!</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.callback-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6f8;
}

.card {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  text-align: center;
  min-width: 320px;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.error p {
  color: #e53e3e;
  margin-bottom: 1rem;
}

.btn {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>