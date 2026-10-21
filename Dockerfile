FROM node:18-alpine

# Install wget and curl tools
RUN apk add --no-cache wget curl

WORKDIR /app

# Initialize package configuration and install Express framework
RUN npm init -y && npm install express

# Download server.js from your GitHub repository
RUN wget -O server.js https://raw.githubusercontent.com/jjjm03299-debug/vpn-tool/refs/heads/main/server.js

# Build-time diagnostic test calls
RUN curl -X GET https://vpn-command-instrument.onrender.com/api/pool

RUN curl -X POST https://vpn-command-instrument.onrender.com/api/connect \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "JP", "delay": 500}'

# Expose the default application port
EXPOSE 3000

# Start the Express server
CMD ["node", "server.js"]
