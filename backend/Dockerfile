FROM docker.m.daocloud.io/library/node:20-alpine AS builder
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM docker.m.daocloud.io/library/node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm config set registry https://registry.npmmirror.com
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8174
CMD ["node", "dist/main.js"]
