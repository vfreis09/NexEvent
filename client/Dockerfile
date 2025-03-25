# Use the official Node.js image as the base
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Accept build-time variable
ARG VITE_PUBLIC_API_KEY
ENV VITE_PUBLIC_API_KEY=$VITE_PUBLIC_API_KEY

# Build the application
RUN npm run build

# Expose the default Vite port
EXPOSE 5173

# Serve the built application
CMD ["npx", "serve", "-s", "dist", "-l", "5173"]