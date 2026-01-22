<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/composables/useAuth';
import config from '@/config';
import { useOrderStore } from '@/stores/orderStore';
import { usePaymentStore } from '@/stores/paymentStore';
import type { ChatMessage } from '@/model/ChatMessage';
import { ChatRole } from '@/model/ChatRole';

const route = useRoute();
const router = useRouter(); 
const chatId = route.params.id as string; 

const orderStore = useOrderStore();
const auth = useAuth();
const isDeleting = ref(false);

const socket = ref<Socket | null>(null);
const messages = ref<ChatMessage[]>([]);
const newMessage = ref('');
const orderDetails = ref<any>(null);

const productInfo = ref<any | null>(null);
const isBuying = ref(false); 

const formatPrice = (amount: number | undefined) => {
  return typeof amount === 'number' ? `$${amount.toFixed(2)}` : '';
};

const myRole = computed(() => {
  if (!orderDetails.value || !auth.state.user) return ChatRole.BUYER; 
  return auth.state.user.sub === orderDetails.value.userId 
    ? ChatRole.BUYER 
    : ChatRole.SELLER;
});

onMounted(async () => {
  try {
    const order = await orderStore.getOrderById(chatId);
    if (!order) throw new Error("You are not authorized to view this order.");
    
    orderDetails.value = order;
    messages.value = order.chatHistory || [];
    
    const orderProduct = order.products && order.products[0];
    productInfo.value = orderProduct;
  } catch (err) {
    console.error("Failed to load history", err);
  }

  socket.value = io(config.ordersService);
  socket.value.on('connect', () => {
    console.log("Connected. Joining room:", chatId);
    socket.value?.emit('subscribeToOrder', chatId);
  });
  socket.value.on('orderMessage', (data: ChatMessage) => {
    messages.value.push(data);
    scrollToBottom();
  });
});

const chatContainer = ref<HTMLElement | null>(null);
const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !socket.value || !auth.state.user) return;

  const payload = {
    orderId: chatId,
    message: {
      text: newMessage.value,
      senderId: auth.state.user.sub,
      chatRole: myRole.value,
      timestamp: new Date()
    }
  };

  socket.value.emit('sendMessage', payload);
  newMessage.value = '';
};

const handleBuy = () => {
  if (!productInfo.value) return;

  if (productInfo.value.stockCount <= 0) {
    alert("This product is currently out of stock.");
    return;
  }

  router.push({ 
    name: 'Checkout', 
    params: { orderId: chatId } 
  });
};

const handleDeleteChat = async () => {
  if (!confirm("Are you sure you want to delete this conversation? This will cancel the order.")) {
    return;
  }

  isDeleting.value = true;

  try {
    const success = await orderStore.deleteOrder(chatId);
    if (success) {
      socket.value?.disconnect();
      router.push('/'); 
    } else {
      alert("Failed to delete the chat.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("An error occurred while deleting.");
  } finally {
    isDeleting.value = false;
  }
};

onUnmounted(() => {
  socket.value?.disconnect();
});
</script>

<template>
  <div class="page-container">
    
    <div class="details-panel">
      
      <div class="details-header">
        <div>
          <h2>Order Details</h2>
          <div v-if="orderDetails" class="sub-header">
            ID: #{{ orderDetails._id.slice(-6) }}
          </div>
        </div>
        
        <button 
          @click="handleDeleteChat" 
          class="btn-pill-delete" 
          :disabled="isDeleting"
        >
          <span v-if="isDeleting">Deleting...</span>
          <span v-else>Delete Order</span> 
        </button>
      </div>

      <hr class="divider" />

      <div v-if="productInfo" class="product-full-info">
        <h3 class="product-title">{{ productInfo.name }}</h3>
        
        <div class="price-row">
          <span class="price-tag">{{ formatPrice(productInfo.price) }}</span>
          <span class="stock-badge">Stock: {{ productInfo.stockCount }}</span>
        </div>

        <div class="action-area">
          <button 
            v-if="myRole === 'BUYER'" 
            @click="handleBuy" 
            class="buy-btn full-width"
            :disabled="isBuying"
          >
            {{ isBuying ? 'Processing...' : 'Buy Now' }}
          </button>
        </div>

        <div class="description-box">
          <h4>Description</h4>
          <p>{{ productInfo.description || 'No description provided.' }}</p>
        </div>
      </div>
    </div>

    <div class="chat-panel">
      <div class="chat-header">
        <h3>{{ myRole === 'BUYER' ? 'Chat with Seller' : 'Chat with Buyer' }}</h3>
      </div>

      <div class="messages-container" ref="chatContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['message-bubble', msg.senderId === auth.state.user?.sub ? 'sent' : 'received']"
        >
          <div class="msg-content">
            <p>{{ msg.text }}</p>
            <span class="time">
              {{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="input-area">
        <input 
          v-model="newMessage" 
          placeholder="Type a message..." 
          autocomplete="off"
        />
        <button type="submit" :disabled="!newMessage.trim()">
          <span v-if="newMessage.trim()">Send</span>
          <span v-else>...</span>
        </button>
      </form>
    </div>

  </div>
</template>

<style scoped>
/* Main Layout Container */
.page-container {
  display: flex;
  flex-direction: row; /* Side by side */
  height: 85vh;
  max-width: 1200px;
  margin: 2rem auto;
  gap: 20px;
  padding: 0 1rem;
}

/* ================= LEFT SIDE: DETAILS ================= */
.details-panel {
  flex: 1; /* Takes up 1 part of space */
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.details-header h2 { margin: 0; color: #1a202c; font-size: 1.5rem; }
.sub-header { color: #718096; font-family: monospace; font-size: 0.9rem; }

.divider { border: 0; border-top: 1px solid #edf2f7; margin: 1rem 0; }

.product-title { font-size: 1.4rem; color: #2d3748; margin-bottom: 0.5rem; }

.price-row { display: flex; align-items: center; gap: 15px; margin-bottom: 1.5rem; }
.price-tag { font-size: 1.5rem; font-weight: 800; color: #2b6cb0; }
.stock-badge { background: #e2e8f0; color: #4a5568; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }

.action-area { margin-bottom: 2rem; }

.description-box h4 { margin-bottom: 0.5rem; color: #4a5568; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
.description-box p { color: #4a5568; line-height: 1.6; white-space: pre-wrap; /* Preserves newlines */ }

/* ================= RIGHT SIDE: CHAT ================= */
.chat-panel {
  flex: 1.5; /* Takes up 1.5 parts (wider than details) */
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 1rem 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #edf2f7;
}
.chat-header h3 { margin: 0; color: #2d3748; font-size: 1.1rem; }

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

/* ================= COMPONENTS & BUTTONS ================= */

/* Red Delete Button */
.btn-pill-delete {
  background: #fff;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 50px; 
  padding: 6px 16px;   
  font-weight: 700;   
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-pill-delete:hover:not(:disabled) { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
.btn-pill-delete:disabled { opacity: 0.5; cursor: not-allowed; }

/* Green Buy Button */
.buy-btn {
  background: #48bb78;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 4px 6px rgba(72, 187, 120, 0.3);
}
.buy-btn.full-width { width: 100%; }
.buy-btn:hover:not(:disabled) { background: #38a169; }
.buy-btn:disabled { background: #a0aec0; cursor: not-allowed; }

/* Chat Bubbles */
.message-bubble { max-width: 75%; display: flex; flex-direction: column; }
.sent { align-self: flex-end; align-items: flex-end; }
.sent .msg-content { background: #3182ce; color: white; padding: 10px 16px; border-radius: 18px 18px 4px 18px; }
.sent .time { color: rgba(255, 255, 255, 0.7); }
.received { align-self: flex-start; align-items: flex-start; }
.received .msg-content { background: #edf2f7; color: #2d3748; padding: 10px 16px; border-radius: 18px 18px 18px 4px; }
.received .time { color: #718096; }
.time { font-size: 0.65rem; display: block; margin-top: 4px; text-align: right; }

/* Input Area */
.input-area {
  padding: 1rem;
  background: white;
  border-top: 1px solid #edf2f7;
  display: flex;
  gap: 10px;
}
input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}
input:focus { background: white; border-color: #3182ce; box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1); }
button[type="submit"] {
  background: #3182ce;
  color: white;
  border: none;
  padding: 0 24px;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
button[type="submit"]:hover:not(:disabled) { background: #2b6cb0; }
button[type="submit"]:disabled { background: #cbd5e0; cursor: default; }

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .page-container {
    flex-direction: column;
    height: auto;
  }
  .details-panel, .chat-panel {
    width: 100%;
    flex: none;
  }
  .chat-panel {
    height: 500px; /* Fixed height for chat on mobile */
  }
}
</style>