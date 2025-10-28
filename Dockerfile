ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app
COPY . .
RUN cat > src/config.js <<EOF
module.exports = {
  jwtSecret: '${JWT_SECRET}',
  db: {
    connection: {
      host: '${DATABASE_HOST}',
      user: '${DATABASE_USERNAME}',
      password: '${DATABASE_PASSWORD}',
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'https://pizza-factory.cs329.click',
    apiKey: '${FACTORY_API_KEY}',
  },
  adminPassword: '${ADMIN_PASSWORD}'
};
EOF
RUN npm ci
EXPOSE 3000
CMD ["cat", "src/config.js"]
