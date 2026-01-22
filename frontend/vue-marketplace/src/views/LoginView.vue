<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const auth = useAuth();


const loading = ref(true);
const initError = ref<string | null>(null);

onMounted(async () => {
  try {

    await auth.init();

    if (auth.state.authenticated) {
      
      router.push('/home');
    }
  } catch (err: any) {
    console.error("Login View Error:", err);
    initError.value = "Failed to connect to Identity Provider. Please try again later.";
  } finally {
    loading.value = false;
  }
});

const performLogin = async () => {
  try {
    await auth.login();
  } catch (err) {
    initError.value = "Could not start login flow.";
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      
      <div class="card-header">
        <h1>Welcome Back</h1>
        <p>Sign in to access the Marketplace</p>
      </div>

      <div v-if="loading" class="state-box loading">
        <div class="spinner"></div>
        <p>Connecting to secure server...</p>
      </div>

      <div v-else-if="initError || auth.error.value" class="state-box error">
        <p class="error-text">⚠️ {{ initError || auth.error.value }}</p>
        <button @click="router.go(0)" class="retry-btn">Retry Connection</button>
      </div>
      <div v-else class="action-box">
        <button @click="performLogin" class="login-btn">
          <span>Sign In with SSO</span>
          <span class="arrow">→</span>
        </button>
        <p class="disclaimer">
          You will be redirected to our secure identity provider (Keycloak) to complete your login.
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f6f8;
  padding: 20px;
}


.login-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.2s;
}


.card-header h1 {
  margin: 0 0 0.5rem 0;
  color: #1a202c;
  font-size: 1.8rem;
}

.card-header p {
  color: #718096;
  margin-bottom: 2rem;
}

/* Login Button */
.login-btn {
  background-color: #007bff;
  color: white;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s, transform 0.1s;
}

.login-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

.disclaimer {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: #a0aec0;
  line-height: 1.4;
}

/* State Boxes (Loading/Error) */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.loading p {
  color: #718096;
  font-size: 0.9rem;
}

.error-text {
  color: #e53e3e;
  background: #fff5f5;
  padding: 10px;
  border-radius: 6px;
  width: 100%;
}

.retry-btn {
  background: transparent;
  border: 1px solid #cbd5e0;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  color: #4a5568;
}

.retry-btn:hover {
  background: #edf2f7;
}

/* Spinner Animation */
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>