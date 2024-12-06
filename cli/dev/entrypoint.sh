useradd -m -s /bin/bash "$SSH_USER"

passwd $SSH_USER <<EOF
$SSH_PASSWORD
$SSH_PASSWORD
EOF

chown -R $SSH_USER /data/website

exec "$@"
