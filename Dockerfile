FROM node:20-alpine

# Required for sharp, tesseract and native builds
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev \
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app

COPY package*.json ./

# Force sharp to build for linux
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
RUN npm install --platform=linux --arch=x64

COPY . .
RUN npm run build

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/index.js"]