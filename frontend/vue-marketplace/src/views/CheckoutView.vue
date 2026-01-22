<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { useProductStore } from '@/stores/productStore';
import { PaymentStatus } from '@/model/Payment';
import type { Payment } from '@/model/Payment';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const paymentStore = usePaymentStore();
const productStore = useProductStore();

const orderId = route.params.orderId as string;
const orderDetails = ref<any>(null);
const productInfo = ref<any>(null);
const loading = ref(true);
const processing = ref(false);

// Quantity State
const quantity = ref(1);

onMounted(async () => {
  try {
    const order = await orderStore.getOrderById(orderId);
    const product = await productStore.fetchProduct(order?.products?.[0]?.productId || '');

    if (!order) throw new Error("Order not found");
    if (!product) throw new Error("Product not found");
    
    orderDetails.value = order;
    productInfo.value = product;


    if (productInfo.value?.stockCount < 1) {
      alert("This product is out of stock.");
      router.back();
    }
  } catch (e) {
    console.error(e);
    alert("Failed to load order details");
    router.back();
  } finally {
    loading.value = false;
  }
});

// Computed Properties
const unitPrice = computed(() => Number(productInfo.value?.price || 0));
const maxStock = computed(() => Number(productInfo.value?.stockCount || 1));

const totalPrice = computed(() => {
  return unitPrice.value * quantity.value;
});

const increaseQty = () => {
  if (quantity.value < maxStock.value) {
    quantity.value++;
  }
};

const decreaseQty = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const handleConfirmPurchase = async () => {
  if (!productInfo.value) return;
  
  processing.value = true;

  try {
    const payment: Payment = {
      orderId: orderId,
      amount: totalPrice.value, 
      currency: 'CZK',
      status: PaymentStatus.PENDING,
      productId: productInfo.value._id,
      productQuantity: quantity.value
    };

    const success = await paymentStore.createPayment(payment);

    if (success) {
     alert("Payment initiated successfully!");
        
      router.push('/orders');
    } else {
      alert("Payment failed: " + paymentStore.error);
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred.");
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <div class="checkout-wrapper">
    
    <div v-if="loading" class="loading">Loading details...</div>

    <div v-else class="checkout-card">
      <div class="header">
        <button @click="router.back()" class="back-btn">← Back</button>
        <h2>Confirm Purchase</h2>
      </div>

      <div class="product-info">
        <h3>{{ productInfo?.name }}</h3>
        <p class="desc">{{ productInfo?.description }}</p>
        <div class="stock-info">Available Stock: {{ maxStock }}</div>
      </div>

      <div class="order-controls">
        <div class="label">Quantity</div>
        
        <div class="qty-selector">
          <button @click="decreaseQty" :disabled="quantity <= 1" class="qty-btn">-</button>
          <input type="number" v-model="quantity" readonly />
          <button @click="increaseQty" :disabled="quantity >= maxStock" class="qty-btn">+</button>
        </div>
      </div>

      <div class="summary">
        <div class="row">
          <span>Unit Price</span>
          <span>${{ unitPrice.toFixed(2) }}</span>
        </div>
        <div class="row total">
          <span>Total</span>
          <span>${{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>

      <button 
        @click="handleConfirmPurchase" 
        class="confirm-btn"
        :disabled="processing"
      >
        {{ processing ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.checkout-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f8fafc;
  padding: 20px;
}

.checkout-card {
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
.header h2 { margin: 0; font-size: 1.5rem; color: #1e293b; }
.back-btn { background: none; border: none; font-size: 1rem; cursor: pointer; color: #64748b; }
.back-btn:hover { color: #3b82f6; }

.product-info { margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; }
.product-info h3 { margin: 0 0 10px 0; font-size: 1.2rem; color: #334155; }
.desc { color: #64748b; font-size: 0.9rem; margin-bottom: 10px; }
.stock-info { font-size: 0.8rem; color: #059669; font-weight: 600; background: #d1fae5; display: inline-block; padding: 4px 10px; border-radius: 20px; }

.order-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.qty-selector { display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
.qty-btn { background: #f1f5f9; border: none; padding: 10px 15px; cursor: pointer; font-weight: bold; font-size: 1.1rem; }
.qty-btn:hover:not(:disabled) { background: #e2e8f0; }
.qty-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
.qty-selector input { width: 50px; text-align: center; border: none; outline: none; font-weight: 600; font-size: 1rem; }

.summary { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
.row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569; }
.row.total { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-weight: 800; font-size: 1.2rem; color: #0f172a; margin-bottom: 0; }

.confirm-btn {
  width: 100%;
  background: #3b82f6;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.confirm-btn:hover:not(:disabled) { background: #2563eb; }
.confirm-btn:disabled { background: #94a3b8; cursor: not-allowed; }
</style>