import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@/model/User';
import config from '@/config'; 
import { useAuth } from '@/composables/useAuth';

export const useUserStore = defineStore('user', () => {
  
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAllUsers() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      
      users.value = await response.json();
    } catch (err: any) {
      console.error("Store Error:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUserById(id: string): Promise<User | null> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users/${id}`);
      if (!response.ok) throw new Error("User not found");
      
      const userData = await response.json();
      return userData; 
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function searchUsers(query: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");

      users.value = await response.json();
    } catch (err: any) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  async function createUser(userData: User): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      const createdUser = await response.json();
      users.value.push(createdUser);
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const auth = useAuth();
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.state.accessToken}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Permission denied.");
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      
      const index = users.value.findIndex(u => u.id === id);
      if (index !== -1) {
        users.value[index] = updatedUser;
      }

      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteUser(id: string): Promise<boolean> {
    const auth = useAuth();
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${config.userService}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.state.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Permission denied.");
        throw new Error("Failed to delete user");
      }

      users.value = users.value.filter(u => u.id !== id);
      return true;
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    users,
    isLoading,
    error,
    fetchAllUsers,
    fetchUserById,
    searchUsers,
    createUser,
    updateUser,
    deleteUser
  };
});