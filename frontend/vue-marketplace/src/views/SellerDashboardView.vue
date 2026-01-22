<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { PaymentStatus } from '@/model/Payment';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const auth = useAuth();
const orderStore = useOrderStore();
const paymentStore = usePaymentStore();

onMounted(async () => {
  const userId = auth.state.user?.sub;
  if (userId) {
    await orderStore.fetchOrdersBySellerId(userId);
    await paymentStore.fetchAllPayments();
  }
});

const salesWithStatus = computed(() => {
  return orderStore.sales.map(order => {

    const payment = paymentStore.payments.find(p => p.orderId === order._id);
    
    return {
      ...order,
      paymentStatus: payment ? payment.status : 'UNPAID',
      paymentAmount: payment ? payment.amount : null,
      productName: order.products?.[0]?.name || 'Unknown Item'
    };
  });
});

const totalRevenue = computed(() => {
  return salesWithStatus.value
    .filter(s => s.paymentStatus === PaymentStatus.SUCCEEDED)
    .reduce((sum, s) => sum + (s.paymentAmount || 0), 0);
});

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
        <div class="title-group">
          <h1>Seller Dashboard</h1>
          <button @click="router.push('/profile')" class="btn-back">← Back</button>
        </div>
        
        <div class="revenue-card">
          <span class="label">Total Revenue</span>
          <span class="value">${{ totalRevenue.toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="orderStore.isLoading" class="state-msg">
        <div class="spinner"></div>
        Loading your sales...
      </div>

      <div v-else-if="salesWithStatus.length === 0" class="state-msg empty">
        <div class="icon">📉</div>
        <h3>No sales yet</h3>
        <p>Orders will appear here when customers buy your products.</p>
      </div>

      <div v-else class="sales-grid">
        <div class="section-label">Incoming Orders ({{ salesWithStatus.length }})</div>
        
        <div v-for="sale in salesWithStatus" :key="sale._id" class="sale-card">
          
          <div class="card-left">
            <div class="order-id">#{{ sale._id.slice(-6) }}</div>
            <h3 class="product-name">{{ sale.productName }}</h3>
            <div class="meta">
              Buyer ID: <span class="code">{{ sale.userId.slice(-6) }}</span>
              <span class="date">• {{ new Date(sale.createdAt || '').toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="card-right">
            <div class="financials">
              <span class="amount">${{ sale.paymentAmount ? sale.paymentAmount.toFixed(2) : '---' }}</span>
              <span :class="['status-badge', getStatusClass(sale.paymentStatus)]">
                {{ sale.paymentStatus }}
              </span>
            </div>
            
            <button @click="router.push(`/chat/${sale._id}`)" class="btn-manage">
              Manage Order
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.page-wrapper { background: #f8fafc; min-height: 100vh; padding: 2rem; }
.container { max-width: 900px; margin: 0 auto; }

/* Header */
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.title-group h1 { margin: 0 0 10px 0; color: #1e293b; font-size: 1.8rem; }
.btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-size: 0.9rem; padding: 0; }
.btn-back:hover { text-decoration: underline; color: #3b82f6; }

/* Revenue Card */
.revenue-card { background: white; padding: 15px 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: right; border: 1px solid #e2e8f0; }
.revenue-card .label { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.revenue-card .value { font-size: 1.8rem; font-weight: 800; color: #10b981; }

/* Grid */
.sales-grid { display: flex; flex-direction: column; gap: 1rem; }
.section-label { font-size: 0.9rem; font-weight: 600; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; }

.sale-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: transform 0.2s, box-shadow 0.2s; }
.sale-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }

/* Left Side */
.order-id { font-family: monospace; color: #94a3b8; font-size: 0.8rem; margin-bottom: 4px; }
.product-name { margin: 0 0 6px 0; font-size: 1.1rem; color: #1e293b; }
.meta { font-size: 0.85rem; color: #64748b; }
.code { background: #f1f5f9; padding: 2px 5px; border-radius: 4px; color: #475569; font-family: monospace; }

/* Right Side */
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.financials { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.amount { font-weight: 700; font-size: 1.1rem; color: #0f172a; }

/* Badges */
.status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.status-paid { background: #dcfce7; color: #166534; }
.status-pending { background: #ffedd5; color: #9a3412; }
.status-failed { background: #fee2e2; color: #991b1b; }
.status-unpaid { background: #f1f5f9; color: #64748b; }

/* Button */
.btn-manage { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.btn-manage:hover { background: #2563eb; }

/* States */
.state-msg { text-align: center; padding: 3rem; color: #64748b; }
.empty .icon { font-size: 2.5rem; margin-bottom: 10px; }
.spinner { border: 3px solid #f1f5f9; border-top: 3px solid #3b82f6; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>