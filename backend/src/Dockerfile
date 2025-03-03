# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the application files
COPY . .

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
