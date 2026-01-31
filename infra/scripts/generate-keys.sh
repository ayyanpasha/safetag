#!/bin/bash
# Generate RS256 key pair for JWT signing
set -e

KEYS_DIR="${1:-./keys}"
mkdir -p "$KEYS_DIR"

echo "Generating RS256 key pair in $KEYS_DIR..."
openssl genrsa -out "$KEYS_DIR/private.pem" 2048
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem"
echo "Done. Keys at $KEYS_DIR/private.pem and $KEYS_DIR/public.pem"
