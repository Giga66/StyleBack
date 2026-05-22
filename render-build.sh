#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# If running on Render, swap the Prisma provider to PostgreSQL
if [ "$RENDER" = "true" ]; then
  echo "Swapping Prisma provider to postgresql for Render..."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
  sed -i 's/url      = "file:dev.sqlite"/url      = env("DATABASE_URL")/g' prisma/schema.prisma
  
  # Generate Prisma client and push DB changes
  npx prisma generate
  npx prisma db push --accept-data-loss
fi
