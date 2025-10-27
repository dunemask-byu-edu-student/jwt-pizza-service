ARG NODE_VERSION=22
ARG JWT_SECRET=CI
ARG FACTORY_API_KEY=UNPROVIDED
ARG ADMIN_PASSWORD=potato
ARG DATABASE_USERNAME=root
ARG DATABASE_PASSWORD=tempdbpassword


FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app
COPY . .
RUN cat > src/config.js <<EOF
module.exports = {
  jwtSecret: '${JWT_SECRET}',
  db: {
    connection: {
      host: '127.0.0.1',
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
CMD ["node", "src/index.js", "3000"]
