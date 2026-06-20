FROM node:20-slim

# Install Tesseract with Tamil + English language packs
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-tam \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "run", "dev"]
