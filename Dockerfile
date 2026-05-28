FROM node:22.11.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=production

#RUN npm ci --only=production
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]