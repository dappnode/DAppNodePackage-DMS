# Stage 1: Build stage
FROM node:18-alpine as builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json, tsconfig.json and yarn.lock (if present) to the container
COPY package.json yarn.lock* tsconfig.json ./

# Install dependencies using yarn
RUN yarn install --production=false    # Install all dependencies, including devDependencies, only for the build stage

# Copy the source code to the container
COPY ./src ./src

# Build the TypeScript code
RUN yarn build

# Stage 2: Production stage
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install only production dependencies
RUN yarn install --production=true 

# Expose the port
EXPOSE 9090

# Start the Express server
CMD ["node", "./dist/index.js"]
