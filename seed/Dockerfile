FROM docker.m.daocloud.io/library/node:20-alpine
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
COPY package.json ./
RUN npm install --omit=dev
COPY seed.js ./
CMD ["node", "seed.js"]
