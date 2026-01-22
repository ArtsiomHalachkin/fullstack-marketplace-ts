import { defineStore } from 'pinia';
import { ref } from 'vue';
import config from '@/config';
import { useAuth } from '@/composables/useAuth';
import type { Payment } from '@/model/Payment';
import { PaymentStatus } from '@/model/Payment';  

export const usePaymentStore = defineStore('payment', () => {

  const payments = ref<Payment[]>([]);
  const currentPayment = ref<Payment | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAllPayments() {
    const auth = useAuth();
    if (!auth.state.accessToken) return;

    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.paymentService}/payments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch payments");

      payments.value = await response.json();
    } catch (err: any) {
      console.error("Payment Store Error:", err);
      error.value = err.message || "Unknown error";
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const auth = useAuth();
    if (!auth.state.accessToken) {
      throw new Error("You must be logged in.");
    }

    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.paymentService}/payments/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch payment details");
      }

      const data = await response.json();
      currentPayment.value = data; 
      return data;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createPayment(paymentData: Payment): Promise<Payment | null> {
    const auth = useAuth();

    if (!auth.state.accessToken) {
      alert("You must be logged in.");
      return null;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.paymentService}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create payment");
      }

      const createdPayment = await response.json();
      await fetchAllPayments();

      return createdPayment;
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally { 
      isLoading.value = false;
    }
  }

  async function updatePaymentStatus(orderId: string, status: PaymentStatus): Promise<boolean> {
    const auth = useAuth();
    if (!auth.state.accessToken) {
      throw new Error("You must be logged in.");
    }

    isLoading.value = true;
    error.value = null;
    
    const payload = { status };

    try {
      const response = await fetch(`${config.paymentService}/payments/${orderId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to update payment status");

      const updatedPayment = await response.json();

      await fetchAllPayments();

      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePayment(orderId: string): Promise<boolean> {
    const auth = useAuth();
    if (!auth.state.accessToken) {
      throw new Error("You must be logged in.");
    }

    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.paymentService}/payments/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete payment");

      await fetchAllPayments();
      
      if (currentPayment.value?.orderId === orderId) {
        currentPayment.value = null;
      }

      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    payments,
    currentPayment,
    isLoading,
    error,
    fetchAllPayments,
    fetchPaymentByOrderId,
    createPayment,
    updatePaymentStatus,
    deletePayment
  };
});