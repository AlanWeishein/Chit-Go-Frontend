# Etapa 1: compila el front con Node. npm run build revisa los tipos y arma dist/.
FROM node:26.13.1-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: nginx sirve dist/ y reenvía /api y /ws al back (ver nginx.conf).
FROM nginx:1.30.7-alpine3.24-slim
COPY nginx.conf /etc/nginx/nginx.conf
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 80
