# ---------- Stage 1: Build Frontend (Same as before) ----------
FROM node:18 AS frontend
WORKDIR /app
COPY my-react-app/package*.json ./
RUN npm install
COPY my-react-app ./
RUN npm run build

# ---------- Stage 2: Final Runtime ----------
# Start with Python (so AI works)
FROM python:3.9-slim

# 1. INSTALL NODE.JS (Crucial Step!)
# We need to download and install Node so 'index.js' can run
RUN apt-get update && apt-get install -y \
    curl \
    libgl1 libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install Python Deps
COPY server/requirements.txt ./server/
RUN pip install --no-cache-dir -r server/requirements.txt

# 3. Install Node Deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

# 4. Copy Code
COPY server/ .
COPY --from=frontend /app/dist ./public

# 5. Start the Node Server (The "Boss")
EXPOSE 3000
CMD ["node", "index.js"]