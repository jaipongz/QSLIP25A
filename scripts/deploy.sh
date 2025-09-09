#!/bin/bash
set -e

echo "🚀 Starting qslip-api deployment..."
cd /home/$(whoami)/public_html/website/QSLIP25A

# 1. Git operations
echo "📦 Updating code from git..."
git fetch origin
git reset --hard origin/main
git pull origin main

# 2. Install dependencies
echo "🔧 Installing dependencies..."
npm install --production

# 3. Build project
echo "🔨 Building project..."
npm run build

# 4. Environment setup
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration!"
fi

# 5. Start/Restart application with PM2
echo "🔄 Managing application process..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "qslip-api"; then
        echo "🔄 Restarting existing application..."
        pm2 restart qslip-api
    else
        echo "🚀 Starting new application..."
        pm2 start dist/app.js --name "qslip-api"
    fi
    pm2 save
else
    echo "⚠️ PM2 not found, starting directly..."
    node dist/app.js &
fi

echo "✅ Deployment completed successfully!"
echo "📊 Check application status with: pm2 status"
echo "📋 View logs with: pm2 logs qslip-api"