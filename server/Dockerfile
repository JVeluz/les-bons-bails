FROM node:22-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm install
COPY shared/ ./shared/
RUN cd shared && npm run build --if-present

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

COPY server/ ./

EXPOSE 3000

CMD ["npm", "start"]