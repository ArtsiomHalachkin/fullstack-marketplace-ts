<script setup lang="ts">
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue"; 
import { useProductStore } from "@/stores/productStore";
import ProductCard from "@/components/ProductCard.vue";

const auth = useAuth();
const router = useRouter();
const productStore = useProductStore();

onMounted(async () => {
  await productStore.fetchProducts(); 
});

const myProducts = computed(() => {
  const currentUserId = auth.state.user?.sub;
  return productStore.products.filter(product => {
    return product.ownerId === currentUserId; 
  });
});

const handleLogout = () => {
  auth.logout();
};
</script>

<template>
  <div class="page-wrapper">
    
    <div class="profile-container">
      <div class="profile-card">
        <div class="header">
          <div class="avatar-placeholder">
            {{ auth.getUsername().charAt(0).toUpperCase() }}
          </div>
          <h1>{{ auth.state.user?.name || 'User Profile' }}</h1>
      
        </div>

        <div class="info-section">
          <div class="info-group">
            <label>Username</label>
            <div class="value">{{ auth.state.user?.preferred_username }}</div>
          </div>

          <div class="info-group">
            <label>Email</label>
            <div class="value">{{ auth.state.user?.email || 'No email provided' }}</div>
          </div>
        </div>

        <div class="actions">
          
          <button @click="router.push('/orders')" class="btn primary-action">
             My Orders
          </button>

          <button @click="router.push('/seller/dashboard')" class="btn secondary">
            Seller Dashboard
          </button>

          <button @click="handleLogout" class="btn logout">
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <div class="products-section">
      
      <div v-if="productStore.isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading products...</p>
      </div>

      <div v-else-if="myProducts.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>No listings yet</h3>
        <p>You haven't listed any products for sale.</p>
        <button class="btn primary" @click="router.push('/seller/add')">Create Your First Product</button>
      </div>

      <div v-else class="product-grid">
        <ProductCard 
          v-for="product in myProducts" 
          :key="product._id" 
          :product="product" 
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Main Page Wrapper */
.page-wrapper {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Profile Container */
.profile-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.profile-card {
  background: white;
  width: 100%;
  max-width: 700px; /* Slightly wider for the grid */
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid #edf2f7;
}

/* Header */
.header {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  background: rgba(255,255,255,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  border: 3px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
.user-role { opacity: 0.9; margin: 4px 0 0; font-size: 0.9rem; background: rgba(0,0,0,0.15); padding: 2px 10px; border-radius: 20px; }

/* Info Section - Grid Layout */
.info-section {
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.info-group { display: flex; flex-direction: column; gap: 6px; }
.full-width { grid-column: span 2; }

.info-group label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.value { font-size: 1rem; color: #334155; font-weight: 500; }
.value.code { 
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: #64748b; 
  font-size: 0.85rem; 
  background: #f1f5f9; 
  padding: 8px 12px; 
  border-radius: 6px; 
  display: block;
  word-break: break-all;
}

/* Actions Bar */
.actions { 
  background: #f8fafc; 
  padding: 20px 30px; 
  display: flex; 
  gap: 12px; 
  align-items: stretch;
}

/* Buttons */
.btn { 
  padding: 12px 16px; 
  border-radius: 8px; 
  font-weight: 600; 
  cursor: pointer; 
  border: 1px solid transparent; 
  font-size: 0.95rem; 
  transition: all 0.2s ease; 
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1; /* Equal width buttons */
}

.btn.secondary { 
  background: white; 
  color: #475569; 
  border-color: #cbd5e1; 
}
.btn.secondary:hover { background: #f1f5f9; border-color: #94a3b8; color: #1e293b; }

.btn.primary-action { 
  background: #0ea5e9; /* Lighter Blue */
  color: white; 
  flex: 1.2; /* Slightly larger emphasis */
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}
.btn.primary-action:hover { background: #0284c7; transform: translateY(-1px); }

.btn.logout { 
  background: white; 
  color: #ef4444; 
  border-color: #fecaca; 
  flex: 0.5; /* Smaller width for logout */
}
.btn.logout:hover { background: #fef2f2; border-color: #ef4444; }

.btn.primary { background: #3b82f6; color: white; }
.btn.primary:hover { background: #2563eb; }

.btn.small-action {
  padding: 6px 12px;
  font-size: 0.85rem;
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}
.btn.small-action:hover { border-color: #3b82f6; color: #3b82f6; }

/* Products Section */
.products-section { max-width: 1100px; margin: 0 auto; padding: 0 20px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
}

.section-title { font-size: 1.5rem; color: #1e293b; margin: 0; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

/* States */
.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
}

.empty-icon { font-size: 3rem; margin-bottom: 10px; opacity: 0.5; }
.empty-state h3 { color: #334155; margin: 0 0 5px 0; }
.empty-state p { margin-bottom: 20px; }

/* Responsive adjustments */
@media (max-width: 600px) {
  .info-section { grid-template-columns: 1fr; }
  .full-width { grid-column: span 1; }
  .actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>