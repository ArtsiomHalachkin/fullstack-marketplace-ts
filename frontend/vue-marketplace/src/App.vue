<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'



</script>

<template>
  <header class="main-header">
    <div class="container">
      <!-- Logo Section -->
      <div class="logo-section">
        <RouterLink to="/" class="logo-link">
    
          <span class="logo-text">GGGMarket</span>
        </RouterLink>
      </div>


      <nav class="main-nav">
        <RouterLink to="/home" class="nav-item">Marketplace</RouterLink>
      </nav>

      <div class="header-actions">
        <RouterLink to="/profile" class="admin-link">Profile</RouterLink>
      </div>
    </div>
  </header>


  <div class="content-wrapper">
    <RouterView />
  </div>
</template>

<style scoped>

.main-header {
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  border-bottom: 1px solid #eaeaea;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo Styling */
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 10px;
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.5px;
}

/* Navigation Styling */
.main-nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 1rem;
  padding: 5px 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-item:hover {
  color: #007bff;
}

/* Active Link Indicator */
.nav-item.router-link-active {
  color: #007bff;
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -24px; /* Aligns with header height */
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #007bff;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
}

/* Header Actions (Right Side) */
.admin-link {
  text-decoration: none;
  font-size: 0.9rem;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.admin-link:hover {
  background-color: #f8f9fa;
  border-color: #bbb;
  color: #333;
}

.admin-link.router-link-active {
  background-color: #333;
  color: #fff;
  border-color: #333;
}

/* Content Wrapper */
.content-wrapper {
  padding-top: 20px;
  min-height: calc(100vh - 70px);
  background-color: #fbfbfb; /* Slight grey background for the page */
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    height: auto;
    padding: 15px;
    gap: 15px;
  }
  
  .main-nav {
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-item.router-link-active::after {
    display: none; /* Hide underline on mobile layout */
  }
  
  .nav-item.router-link-active {
    font-weight: 700;
    text-decoration: underline;
  }
}
</style>