#!/bin/bash

echo "Provisioning IoT development machine..."

echo "Update package information, ensure that APT works with the https method, and that CA certificates are installed."
apt-get install apt-transport-https ca-certificates

echo "Add the new GPG key......"
apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D

echo "Add an entry for your Ubuntu operating system......."
echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" >> /etc/apt/sources.list.d/docker.list

echo "Update the APT package index......"
apt-get update

echo "Purge the old repo if it exists....."
apt-get purge lxc-docker

echo "Install the recommended linux-image-extra package....."
apt-get install linux-image-extra-$(uname -r)

echo "Installing Git"
apt-get install git -y > /dev/null

echo "Install Docker....."
sudo apt-get install -y docker-engine

echo "Install Docker Machine......"
sudo curl -L https://github.com/docker/machine/releases/download/v0.7.0/docker-machine-`uname -s`-`uname -m` > /usr/local/bin/docker-machine && \
sudo chmod +x /usr/local/bin/docker-machine