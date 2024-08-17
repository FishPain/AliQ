# Use the official Node.js image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

RUN apt-get update

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . /app

# Build the Next.js application
RUN npm run build

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the Next.js application and the worker using Supervisor
CMD ["npm", "run", "start"]
