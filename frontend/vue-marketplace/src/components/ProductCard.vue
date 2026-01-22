<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Product } from '../model/Product';
import { useAuth } from '@/composables/useAuth';
import { useProductStore } from '@/stores/productStore';
import { useOrderStore } from '@/stores/orderStore';

const props = defineProps<{ product: Product }>();
const auth = useAuth();
const orderStore = useOrderStore();
const productStore = useProductStore();
const router = useRouter();

const isConnecting = ref(false);

const isOwner = computed(() => {
  if (!auth.state.user) return false;
  return auth.state.user.sub === props.product.ownerId;
});

const existingChatOrder = computed(() => {
  if (!isOwner.value || !orderStore.sales) return null;
    return orderStore.sales.find(order => 
    order.products.some(p => p.productId === props.product._id)
  );
});


const hasReceivedMessages = computed(() => {
  return !!existingChatOrder.value;
});

const handleShowProfile = () => {
  if (props.product.ownerId) {
    router.push({ 
      name: 'seller-profile', 
      params: { id: props.product.ownerId } 
    });
  }
};

const handleMessageSeller = async () => {
  if (!auth.state.user) {
    alert("You must be logged in to message the seller.");
    return;
  }
  isConnecting.value = true;
  try {
    const chatRoomId = await orderStore.initiateChat(props.product._id!);
    if (chatRoomId) {
      router.push(`/chat/${chatRoomId}`);
    }
  } catch (error) {
    console.error("Chat Error:", error);
    alert("Could not start conversation.");
  } finally {
    isConnecting.value = false;
  }
};


const handleSelfChat = () => {
  if (existingChatOrder.value) {
    router.push(`/chat/${existingChatOrder.value._id}`);
  }
};

const handleDelete = () => {
  if (confirm(`Delete "${props.product.name}"?`)) {
    productStore.deleteProduct(props.product._id!);
  }
};

const handleEdit = () => {
  router.push(`/seller/edit/${props.product._id}`);
};
</script>

<template>
  <div class="product-card">
    <div class="card-content">
      <div class="card-header">
        <div class="title-section">
          <h3>{{ product.name }}</h3>
          <span class="stock-badge" :class="{'low': (product.stockCount || 0) < 5}">
            {{ (product.stockCount || 0) < 5 ? 'Low Stock' : 'In Stock' }} ({{ product.stockCount || 0 }})
          </span>
        </div>
        <div class="price-tag">${{ product.price.toFixed(2) }}</div>
      </div>
      
      <p class="desc">{{ product.description || 'No description provided.' }}</p>
      
      <div class="card-footer">
        <div class="action-row">
          
          <template v-if="isOwner">
            <div class="primary-actions">
              <button @click.prevent="handleEdit" class="action-btn edit">
                <i class="icon-edit"></i> Edit
              </button>
              
              <button 
                v-if="hasReceivedMessages"
                @click.prevent="handleSelfChat" 
                class="action-btn chat-btn"
                title="View incoming messages for this product"
              >
                Reply to Chat
              </button>
            </div>

            <button @click.prevent="handleDelete" class="action-btn delete">
              Delete
            </button>
          </template>

          <div v-else class="primary-actions full-width">
            <button 
              @click.prevent="handleMessageSeller" 
              class="action-btn chat-btn full-width"
              :disabled="isConnecting"
            >
              {{ isConnecting ? 'Connecting...' : 'Message Seller' }}
            </button>

            <button @click.prevent="handleShowProfile" class="action-btn edit">
              <i class="icon-user"></i> View Seller
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (Keep your existing styles exactly as they were) ... */
.product-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.08);
  border-color: transparent;
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.title-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.2;
}

.stock-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: #e6fffa;
  color: #2c7a7b;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.stock-badge.low {
  background-color: #fff5f5;
  color: #c53030;
}

.price-tag {
  font-size: 1.4rem;
  font-weight: 800;
  color: #2d3748;
  letter-spacing: -0.5px;
}

.desc {
  color: #718096;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 2rem;
  flex-grow: 1; 
}

.card-footer {
  margin-top: auto;
  border-top: 1px solid #edf2f7;
  padding-top: 1rem;
}

.action-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.primary-actions {
  display: flex;
  gap: 10px;
}

.primary-actions.full-width {
  width: 100%;
}
.primary-actions.full-width .chat-btn {
  width: 100%;
  justify-content: center;
}

.action-btn {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.action-btn.edit {
  background-color: #f7fafc;
  color: #4a5568;
}
.action-btn.edit:hover {
  background-color: #e2e8f0;
  color: #2d3748;
}

.chat-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(56, 161, 105, 0.2);
}
.chat-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(56, 161, 105, 0.3);
}
.chat-btn:disabled {
  background: #cbd5e0;
  box-shadow: none;
  cursor: not-allowed;
}

.action-btn.delete {
  margin-left: auto; 
  background-color: transparent;
  color: #e53e3e;
  border: 1px solid transparent;
  padding: 8px 12px;
}
.action-btn.delete:hover {
  background-color: #fff5f5;
  border-color: #feb2b2;
}
</style>