FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create volumes for persistent data
VOLUME [ "/usr/src/app/data", "/usr/src/app/uploads" ]

# Expose ports for screen (80) and admin (8080)
EXPOSE 80 8080

CMD [ "node", "server.js" ]
