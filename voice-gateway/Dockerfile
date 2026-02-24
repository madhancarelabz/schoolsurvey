FROM node:20-alpine

# Install ffmpeg for audio conversion (Phase 4: WebM → WAV)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory for temporary audio files
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
