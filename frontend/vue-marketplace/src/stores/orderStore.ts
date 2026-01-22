import { defineStore } from 'pinia';
import config from '@/config';
import { ref } from 'vue'; 
import type { OrderItem } from '@/model/Order';
import { useAuth } from '@/composables/useAuth';


export const useOrderStore = defineStore('order', () => {

  const orders = ref<OrderItem[]>([]);
  const sales = ref<OrderItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function initiateChat(productId: string): Promise<string | null> {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in to message the seller.");
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {

      const response = await fetch(`${config.ordersService}/orders/conversations/initiate/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start conversation");
      }

      const resp = await response.json();
      return resp._id;

    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (initiateChat):", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOrders() {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in to message the seller.");
      return null;
    }


    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.ordersService}/orders`, {
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      orders.value = data;
    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (fetchOrders):", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOrdersByUserId(userId: string) {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in to message the seller.");
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.ordersService}/orders/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      orders.value = data;
    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (fetchOrders by userId):", err);
    } finally {
      isLoading.value = false;
    }
     
  }

  async function fetchOrdersBySellerId(sellerId: string) {
    const auth = useAuth();
    if (!auth.state.accessToken) return;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.ordersService}/orders/seller/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch sales history");

      const data = await response.json();
      sales.value = data; 
    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (fetchSellerOrders):", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function getOrderById(orderId: string): Promise<OrderItem | null> {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in to message the seller.");
      return null;
    }


    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.ordersService}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch order");

      const order = await response.json() as OrderItem;
      return order;
    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (getOrderById):", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteOrder(orderId: string): Promise<boolean | null> {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in to message the seller.");
      return null;
    }


    isLoading.value = true;
    error.value = null; 

    try {
      const response = await fetch(`${config.ordersService}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to delete order");
      return true;
    } catch (err: any) {
      error.value = err.message;
      console.error("Store Error (deleteOrder):", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }


return {
   initiateChat,
    fetchOrders,
    getOrderById,
    deleteOrder,
    fetchOrdersByUserId,
    fetchOrdersBySellerId,
    sales,
    orders,
    isLoading,
    error
  };

});