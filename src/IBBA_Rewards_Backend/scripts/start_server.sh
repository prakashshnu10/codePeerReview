#!/bin/bash
# Set the HOME environment variable
export HOME=/home/ubuntu
sleep 5
# Restart the PM2-managed application
pm2 restart ibba-backend-rewards-pre-prod
echo "Server started and application restarted!"
