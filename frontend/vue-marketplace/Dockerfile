# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Pass backend URL from docker argument to the environment variable
ARG VITE_BACKEND_URL
ARG VITE_STATUS_BACKEND_URL
ARG VITE_KEYCLOAK_BASE_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_STATUS_BACKEND_URL=${VITE_STATUS_BACKEND_URL}
ENV VITE_KEYCLOAK_BASE_URL=${VITE_KEYCLOAK_BASE_URL}
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}



# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 4173

# Start the application
# Must use the --host flag to expose the app to the network of Docker containers
CMD ["npm", "run", "preview", "--", "--host"]