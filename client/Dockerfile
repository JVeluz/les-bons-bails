FROM node:22-alpine AS builder

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm install
COPY shared/ ./shared/
RUN cd shared && npm run build --if-present

WORKDIR /app/front-end
COPY front-end/package*.json ./
RUN npm install

COPY front-end/ ./

ARG API_URL
ENV API_URL=$API_URL
RUN echo "API_URL=${API_URL}" > .env

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/front-end/public /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}'

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]