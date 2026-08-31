#!/bin/bash
# ==============================================================================
# Herbal AI - Docker & Docker Compose Setup Script for Ubuntu VPS
# ==============================================================================

set -e

echo "--> Updating system package index..."
sudo apt-get update -y

echo "--> Installing prerequisite packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

echo "--> Adding Docker official GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes

echo "--> Setting up Docker APT repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "--> Installing Docker Engine, CLI, Containerd, and Compose Plugin..."
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "--> Enabling and starting Docker daemon..."
sudo systemctl enable docker
sudo systemctl start docker

echo "--> Adding current user to docker group..."
sudo usermod -aG docker "$USER" || true

echo "--> Docker setup completed successfully!"
docker --version
docker compose version
