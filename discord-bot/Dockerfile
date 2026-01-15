FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --production --legacy-peer-deps

COPY . .

CMD ["npm", "start"]
