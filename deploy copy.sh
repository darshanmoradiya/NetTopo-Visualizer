#!/bin/bash
set -e

echo "🔨 Building React app..."
npm run build

echo "🚚 Deploying to Nginx..."
sudo rm -rf /var/www/reactapp_new
sudo mkdir -p /var/www/reactapp_new
sudo cp -r dist/* /var/www/reactapp_new/
sudo chown -R www-data:www-data /var/www/reactapp_new

sudo rm -rf /var/www/reactapp
sudo mv /var/www/reactapp_new /var/www/reactapp

echo "✅ Deployment complete"
