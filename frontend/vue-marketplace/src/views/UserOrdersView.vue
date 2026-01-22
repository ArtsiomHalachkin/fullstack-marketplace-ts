<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { PaymentStatus } from '@/model/Payment';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const orderStore = useOrderStore();
const paymentStore = usePaymentStore();
const auth = useAuth();

const processingOrderId = ref<string | null>(null);
const isClearing = ref(false); // State for the clear button loading

onMounted(async () => {
  await fetchData();
});

async function fetchData() {
  if (!auth.state.user?.sub) return;
  
  await Promise.all([
    orderStore.fetchOrdersByUserId(auth.state.user.sub),
    paymentStore.fetchAllPayments()
  ]);
}

const ordersWithStatus = computed(() => {
  return orderStore.orders.map(order => {
    const payment = paymentStore.payments.find(p => p.orderId === order._id);
    return {
      ...order,
      paymentStatus: payment ? payment.status : 'UNPAID', 
      paymentAmount: payment ? payment.amount : null,
      paymentCurrency: payment ? payment.currency : 'USD',
    };
  });
});

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- NEW FUNCTION: CLEAR HISTORY ---
const handleClearHistory = async () => {
  if (orderStore.orders.length === 0) return;
  
  const confirmed = confirm("Are you sure you want to delete your entire order history? This cannot be undone.");
  if (!confirmed) return;

  isClearing.value = true;
  try {
  
    const ordersToDelete = [...orderStore.orders];
    
    // We execute these concurrently for speed
    const deletePromises = ordersToDelete.map(order => 
      orderStore.deleteOrder(order._id) 
    );
    
    await Promise.all(deletePromises);
    
    await fetchData();
  } catch (e) {
    console.error("Failed to clear history", e);
    alert("Could not clear all orders. Please try again.");
  } finally {
    isClearing.value = false;
  }
};

const handleConfirm = async (orderId: string) => {
  if (!confirm("Simulate successful payment for this order?")) return;
  
  processingOrderId.value = orderId;
  try {
    await paymentStore.updatePaymentStatus(orderId, PaymentStatus.SUCCEEDED);
    await fetchData(); 
  } catch (e) {
    alert("Failed to confirm order.");
  } finally {
    processingOrderId.value = null;
  }
};

const handleCancel = async (orderId: string) => {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  processingOrderId.value = orderId;
  try {
    await paymentStore.updatePaymentStatus(orderId, PaymentStatus.FAILED);
    await fetchData();
  } catch (e) {
    alert("Failed to cancel order.");
  } finally {
    processingOrderId.value = null;
  }
};

const goToChat = (orderId: string) => {
  router.push(`/chat/${orderId}`);
};

const getStatusClass = (status: string) => {
  switch (status) {
    case PaymentStatus.SUCCEEDED: return 'status-paid';
    case PaymentStatus.PENDING: return 'status-pending';
    case PaymentStatus.FAILED: return 'status-failed';
    default: return 'status-unpaid';
  }
};
</script>

<template>
  <div class="page-wrapper">
    <div class="container">
      <div class="header">
        <h1>My Orders</h1>
        <div class="header-actions">
          <button 
            v-if="ordersWithStatus.length > 0" 
            @click="handleClearHistory" 
            class="btn-danger"
            :disabled="isClearing"
          >
            {{ isClearing ? 'Clearing...' : 'Clear History' }}
          </button>
          <button @click="router.push('/profile')" class="btn-secondary">Back to Profile</button>
        </div>
      </div>

      <div v-if="orderStore.isLoading && !processingOrderId && !isClearing" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your orders...</p>
      </div>

      <div v-else-if="ordersWithStatus.length === 0" class="empty-state">
        <p>You haven't placed any orders yet.</p>
        <button @click="router.push('/')" class="btn-primary">Browse Products</button>
      </div>

      <div v-else class="orders-grid">
        <div v-for="order in ordersWithStatus" :key="order._id" class="order-card">
          
          <div class="card-header">
            <span class="order-id">#{{ order._id.slice(-6) }}</span>
            <div class="meta-right">
              <span class="date">{{ formatDate(order.createdAt) }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="product-info">
              <h3>{{ order.products?.[0]?.name || 'Product Unavailable' }}</h3>
              <p class="description">{{ order.products?.[0]?.description || 'No description' }}</p>
            </div>

            <div class="payment-info">
              <div class="price-block">
                <span class="currency">{{ order.paymentCurrency }}</span>
                <span class="price">{{ order.paymentAmount ? order.paymentAmount.toFixed(2) : '---' }}</span>
              </div>
              
              <div :class="['status-badge', getStatusClass(order.paymentStatus)]">
                {{ order.paymentStatus }}
              </div>
            </div>
          </div>

          <div class="card-footer">
            
            <div v-if="order.paymentStatus === PaymentStatus.PENDING" class="pending-actions">
              <button 
                @click="handleCancel(order._id)" 
                class="btn-action cancel"
                :disabled="processingOrderId === order._id"
              >
                Cancel
              </button>
              <button 
                @click="handleConfirm(order._id)" 
                class="btn-action confirm"
                :disabled="processingOrderId === order._id"
              >
                {{ processingOrderId === order._id ? 'Processing...' : 'Confirm Payment' }}
              </button>
            </div>

            <div v-else class="completed-msg">
              <span v-if="order.paymentStatus === PaymentStatus.SUCCEEDED"> Order Complete</span>
              <span v-if="order.paymentStatus === PaymentStatus.FAILED"> Order Cancelled</span>
            </div>

            <button @click="goToChat(order._id)" class="btn-chat">
              Chat & Details &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (Keep your existing styles) ... */

/* NEW STYLES */
.header-actions {
  display: flex;
  gap: 10px;
}

.btn-danger {
  background: white;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ... (Keep the rest of your existing styles below) ... */
.page-wrapper {
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 2rem 1rem;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 { color: #1e293b; margin: 0; font-size: 1.8rem; }

/* Cards */
.orders-grid { display: flex; flex-direction: column; gap: 1.5rem; }

.order-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.order-card:hover { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

.card-header {
  background: #f1f5f9;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 0.85rem;
  font-family: monospace;
}

.card-body {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.product-info { flex: 1; min-width: 200px; }
.product-info h3 { margin: 0 0 6px 0; color: #334155; font-size: 1.1rem; }
.description { margin: 0; color: #94a3b8; font-size: 0.9rem; }

.payment-info { text-align: right; }
.price-block { font-size: 1.25rem; font-weight: 700; color: #0f172a; display: flex; align-items: baseline; gap: 4px; justify-content: flex-end; }
.currency { font-size: 0.85rem; color: #94a3b8; font-weight: 500; }

/* Status Badges */
.status-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.status-paid { background: #dcfce7; color: #166534; }
.status-pending { background: #ffedd5; color: #9a3412; }
.status-failed { background: #fee2e2; color: #991b1b; }
.status-unpaid { background: #f1f5f9; color: #64748b; }

/* Footer & Actions */
.card-footer {
  padding: 15px 20px;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pending-actions { display: flex; gap: 10px; }

.btn-action {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-action.confirm {
  background: #22c55e;
  color: white;
}
.btn-action.confirm:hover { background: #16a34a; }

.btn-action.cancel {
  background: white;
  color: #ef4444;
  border-color: #fca5a5;
}
.btn-action.cancel:hover { background: #fef2f2; border-color: #ef4444; }

.btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

.completed-msg { font-size: 0.9rem; color: #64748b; font-weight: 500; }

.btn-chat {
  background: transparent;
  color: #3b82f6;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-chat:hover { text-decoration: underline; }

.btn-secondary { background: white; border: 1px solid #cbd5e0; padding: 8px 16px; border-radius: 6px; cursor: pointer; color: #475569; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }

/* Loaders */
.loading-state, .empty-state { text-align: center; padding: 4rem 1rem; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 10px; }
.spinner { border: 3px solid #f1f5f9; border-top: 3px solid #3b82f6; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>