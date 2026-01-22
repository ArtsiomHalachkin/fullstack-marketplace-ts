<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProductStore } from "@/stores/productStore";
import { useOrderStore } from "@/stores/orderStore";
import { useAuth } from "@/composables/useAuth"; // 1. Import Auth
import ProductCard from "@/components/ProductCard.vue";


const productStore = useProductStore();
const orderStore = useOrderStore();
const auth = useAuth(); 
const error = ref(null as string | null);

onMounted(async () => {

  const fetchCatalog = async () => {
    try {
      await productStore.fetchProducts();
    } catch (err: any) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        error.value = 'Forbidden';
      }
    }
  };

 
  const fetchSellerHistory = async () => {
    if (auth.state.user?.sub) {
      try {
        await orderStore.fetchOrdersBySellerId(auth.state.user.sub);
      } catch (e) {
        console.error("Background fetch for seller history failed", e);
      }
    }
  };

  // 5. Run them in parallel for better performance
  await Promise.all([
    fetchCatalog(),
    fetchSellerHistory()
  ]);
});
</script>

<template>
  <main class="home-page">
    <div class="header-section">
      <div>
        <h1>Marketplace</h1>
        <p>Browse items or sell your own.</p>
      </div>
      <router-link to="/seller/add" class="add-btn">+ Sell Item</router-link>
    </div>

    <AccessDenied v-if="error === 'Forbidden'" />

    <div v-else-if="productStore.isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading catalog...</p>
    </div>

    <div v-else-if="productStore.products.length === 0" class="empty-state">
      <h3>No products yet</h3>
      <p>Be the first one to list an item!</p>
      <router-link to="/seller/add" class="cta-link">Create Listing</router-link>
    </div>

    <div v-else class="product-grid">
      <ProductCard 
        v-for="product in productStore.products" 
        :key="product._id" 
        :product="product" 
      />
    </div>
  </main>
</template>

<style scoped>
/* ... (Your existing styles remain exactly the same) ... */
.home-page { padding: 2rem; max-width: 1100px; margin: 0 auto; }

.header-section { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  margin-bottom: 2.5rem; 
  border-bottom: 1px solid #eaeaea; 
  padding-bottom: 1.5rem; 
}

.header-section h1 { margin: 0; font-size: 2rem; }
.header-section p { color: #666; margin: 0.5rem 0 0; }

.add-btn { 
  background: #28a745; 
  color: white; 
  padding: 10px 20px; 
  text-decoration: none; 
  border-radius: 6px; 
  font-weight: 500; 
  transition: background 0.2s; 
}
.add-btn:hover { background: #218838; }

/* Grid Layout */
.product-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 25px; 
}

/* Loading & Empty States */
.loading-state, .empty-state { text-align: center; padding: 4rem; color: #666; }
.spinner { 
  border: 3px solid #f3f3f3; 
  border-top: 3px solid #007bff; 
  border-radius: 50%; 
  width: 30px; 
  height: 30px; 
  animation: spin 1s linear infinite; 
  margin: 0 auto 1rem; 
}

@keyframes spin { 
  0% { transform: rotate(0deg); } 
  100% { transform: rotate(360deg); } 
}
</style>