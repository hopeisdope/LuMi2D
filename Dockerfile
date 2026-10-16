# LuMi2d als container: eerst bouwen met Node, daarna serveren met een kleine nginx.
# Node op Debian (glibc) i.p.v. Alpine: TypeScript 7 en Vite 8 gebruiken native binaries.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
