#!/bin/bash
# ==============================================================================
# Herbal AI - Nginx & Certbot (SSL) Setup Script for Ubuntu VPS
# ==============================================================================

set -e

echo "--> Updating system package index..."
sudo apt-get update -y

echo "--> Installing Nginx and Certbot..."
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "--> Enabling and starting Nginx service..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "--> Configuring firewall (UFW) to allow HTTP, HTTPS, and SSH..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable || true

echo "--> Copying Nginx configuration..."
if [ -f "/root/herbal-ai/nginx.conf" ]; then
    sudo cp /root/herbal-ai/nginx.conf /etc/nginx/sites-available/herbalai
    sudo ln -sf /etc/nginx/sites-available/herbalai /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    echo "--> Nginx configuration linked and reloaded."
else
    echo "--> Note: /root/herbal-ai/nginx.conf not found. Please copy your configuration file to /etc/nginx/sites-available/herbalai."
fi

echo "--> Nginx and Certbot setup completed successfully!"
