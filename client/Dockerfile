# Use the official Node.js image as the base
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Clean up any previous node_modules and package-lock.json
RUN rm -rf node_modules package-lock.json

# Install react and react-dom version 17
RUN npm install react@17 react-dom@17

# Install dependencies with the --legacy-peer-deps flag to resolve conflicts
RUN npm install --legacy-peer-deps --force

# Copy the rest of the application code
COPY . .

# Expose port 5173 (default Vite dev server port)
EXPOSE 5173

# Start the Vite dev server
CMD ["npm", "run", "build"]
