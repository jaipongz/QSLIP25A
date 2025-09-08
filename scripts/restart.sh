#!/bin/bash
set -e

echo "🔄 Restarting qslip-api..."
cd /home/$(whoami)/qslip-api

if command -v pm2 &> /dev/null && pm2 list | grep -q "qslip-api"; then
    pm2 restart qslip-api
    echo "✅ Application restarted!"
else
    echo "⚠️ Application not running with PM2, starting now..."
    npm start
fi