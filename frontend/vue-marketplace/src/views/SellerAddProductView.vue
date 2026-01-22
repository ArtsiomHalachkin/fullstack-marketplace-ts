<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';

const router = useRouter();
const productStore = useProductStore();

const form = reactive({
  name: '',
  description: '',
  price: 0,
  stockCount: 0,
  ownerId: ''
});

async function submitProduct() {
  if (form.name.length < 3 || form.name.length > 50) {
    alert("Name must be between 3 and 50 characters");
    return;
  }
  if (form.price <= 0) {
    alert("Price must be positive");
    return;
  }
  if (form.stockCount < 0 || form.stockCount > 100) {
    alert("Stock count must be between 0 and 100");
    return;
  }

  const success = await productStore.createProduct(form);

  if (success) {
    alert("Product Created Successfully!");
    router.push('/'); 
  } else {
    
    alert("Error creating product: " + (productStore.error || "Unknown error"));
  }
}
</script>

<template>
  <div class="seller-page">
    <h1>Seller Dashboard</h1>
    <p class="subtitle">List a new item for sale</p>
    
    <form @submit.prevent="submitProduct" class="product-form">
      <div class="form-group">
        <label>Product Name (3-50 chars)</label>
        <input 
          v-model="form.name" 
          placeholder="e.g. Vintage Camera" 
          required 
          minlength="3" 
          maxlength="50" 
        />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea 
          v-model="form.description" 
          placeholder="Describe the condition, specs, etc."
        ></textarea>
      </div>

      <div class="row">
        <div class="form-group half">
          <label>Price ($)</label>
          <input 
            type="number" 
            v-model.number="form.price" 
            step="0.01" 
            min="0.01" 
            required 
          />
        </div>

        <div class="form-group half">
          <label>Stock (Max 100)</label>
          <input 
            type="number" 
            v-model.number="form.stockCount" 
            min="0" 
            max="100" 
            required 
          />
        </div>
      </div>

      <!-- Use productStore.isLoading for button state -->
      <button type="submit" :disabled="productStore.isLoading" class="submit-btn">
        {{ productStore.isLoading ? 'Publishing...' : 'List Product' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.seller-page { max-width: 500px; margin: 3rem auto; padding: 2rem; background: #fff; border: 1px solid #e1e4e8; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.subtitle { color: #666; margin-bottom: 1.5rem; margin-top: -0.5rem; }
.product-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-weight: 500; font-size: 0.9rem; color: #333; }
.row { display: flex; gap: 1rem; }
.half { flex: 1; }
input, textarea { padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; transition: border-color 0.2s; }
input:focus, textarea:focus { border-color: #007bff; outline: none; }
textarea { height: 120px; resize: vertical; }
.submit-btn { padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
.submit-btn:hover { background: #0056b3; }
.submit-btn:disabled { background: #a0cfff; cursor: not-allowed; }
</style>