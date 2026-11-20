
FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Crear un usuario sin privilegios
RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["npm", "start"]
