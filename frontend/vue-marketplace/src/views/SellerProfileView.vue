<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProductStore } from "@/stores/productStore";
import { useUserStore } from "@/stores/userStore";
import ProductCard from "@/components/ProductCard.vue";
import type { User } from "@/model/User";
import { useAuth } from "@/composables/useAuth";

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();

const auth = useAuth();

const sellerId = route.params.id as string;
const isLoadingProfile = ref(false);

onMounted(async () => {
  await productStore.fetchProducts();

});

const sellerProducts = computed(() => {
  return productStore.products.filter(product => {
    return product.ownerId === sellerId;
  });
});

</script>

<template>
  <div class="page-wrapper">
    
    <div class="profile-header">
      <div class="header-content">
        
        <div v-if="isLoadingProfile" class="loading-header">
          <div class="spinner small"></div>
          <p>Loading seller details...</p>
        </div>

        <div v-else class="loaded-header">
          <div class="avatar-placeholder">
            {{ auth.getUsername().charAt(0).toUpperCase() }}
          </div>
          
          <h1>{{ auth.getUsername() || 'Unknown Seller' }}</h1>
          
          <div class="meta-info">
            <i class="icon-mail"></i> {{ auth.getUserEmail() || 'No email available' }}
          </div>
        </div>

        <button @click="router.back()" class="btn back-btn">
          &larr; Back to Shop
        </button>
      </div>
    </div>

    <div class="products-section">
      <h2 class="section-title">
        Listings by {{ auth.getUsername()}}
      </h2>
      
      <div v-if="productStore.isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading inventory...</p>
      </div>

      <div v-else-if="sellerProducts.length === 0" class="empty-state">
        <p>This seller has no active listings.</p>
      </div>

      <div v-else class="product-grid">
        <ProductCard 
          v-for="product in sellerProducts" 
          :key="product._id" 
          :product="product" 
        />
      </div>
    </div>

  </div>
</template>

<style scoped>
.page-wrapper {
  background-color: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 4rem;
}

/* Header Styles */
.profile-header {
  background: white;
  border-bottom: 1px solid #eaeaea;
  padding: 40px 20px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loaded-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 15px;
  box-shadow: 0 4px 10px rgba(118, 75, 162, 0.3);
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #2d3748;
}

.meta-info {
  margin-top: 8px;
  color: #718096;
}

.email {
  font-size: 1rem;
  margin: 0 0 4px 0;
  color: #4a5568;
}

.subtitle {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
}

.code {
  font-family: monospace;
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4a5568;
}

.back-btn {
  margin-top: 25px;
  background: transparent;
  border: 1px solid #cbd5e0;
  color: #4a5568;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.back-btn:hover {
  background: #edf2f7;
  color: #2d3748;
  border-color: #a0aec0;
}

/* Grid Styles */
.products-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 1.25rem;
  color: #4a5568;
  margin-bottom: 1.5rem;
  font-weight: 600;
  border-left: 4px solid #764ba2;
  padding-left: 12px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.loading-state, .empty-state, .loading-header {
  text-align: center;
  padding: 3rem;
  color: #a0aec0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #764ba2;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>