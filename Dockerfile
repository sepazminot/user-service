FROM node:22.11.0-slim

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

#RUN npm ci --only=production
RUN npm install --omit=dev

COPY . .

USER node

EXPOSE 3000

CMD ["node", "server.js"]