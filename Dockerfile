FROM node:20-alpine

# Required for sharp and tesseract
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/index.js"]