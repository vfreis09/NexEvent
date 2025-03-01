# Use an official Node.js image as base
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the backend port
EXPOSE 3000

# Start the backend (for development with hot-reloading)
CMD ["npm", "run", "dev"]
