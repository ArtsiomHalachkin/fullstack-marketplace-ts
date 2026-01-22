import { defineStore } from 'pinia';
import { ref } from 'vue';
import config from '@/config';
import type { Product } from '@/model/Product';
import { useAuth } from '@/composables/useAuth';

export const useProductStore = defineStore('product', () => {

  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProducts() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.productService}/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      
      products.value = await response.json();
    } catch (err: any) {
      error.value = err.message || "Unknown error";
      console.error("Store Error:", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function createProduct(newProduct: Product): Promise<boolean> {
    const auth = useAuth();
    
    if (!auth.state.accessToken) {
      alert("You must be logged in to list items.");
      return false;
    }

    isLoading.value = true;
    error.value = null;

    newProduct.ownerId = auth.state.user?.sub;

    try {
      const response = await fetch(`${config.productService}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        },
        body: JSON.stringify(newProduct)
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Session expired. Please login again.");
        if (response.status === 403) throw new Error("You do not have permission.");
        throw new Error("Failed to create product");
      }
      
      const createdItem = await response.json();
      
      products.value.push(createdItem);
      
      return true; 
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    const auth = useAuth();
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.productService}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error("Failed to update product");

      const updatedProduct = await response.json();
      await fetchProducts();

      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProduct(productId: string) {
    const auth = useAuth();
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.productService}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete product");

      await fetchProducts();
      
    } catch (err: any) {
      error.value = err.message;
      alert("Error deleting product: " + err.message);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProduct(id: string): Promise<Product | null> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.productService}/products/${encodeURIComponent(id)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch product");
      }

      const product = await response.json() as Product;

      return product;
    } catch (err: any) {
      error.value = err.message || "Unknown error";
      console.error("Store Error (fetchProduct):", err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchProductByOwnerId(ownerId: string): Promise<Product[]> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${config.productService}/products/owner/${encodeURIComponent(ownerId)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products by owner");
      }

      const products = await response.json() as Product[];
      return products;
    } catch (err: any) {
      error.value = err.message || "Unknown error";
      console.error("Store Error (fetchProductByOwnerId):", err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProduct
  };
});