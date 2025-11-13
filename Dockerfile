ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app
COPY . .
RUN cat > src/config.js <<EOF
module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  db: {
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'https://pizza-factory.cs329.click',
    apiKey: process.env.FACTORY_API_KEY,
  },
  adminPassword: process.env.ADMIN_PASSWORD,
  metrics: {
    apiKey: process.env.GRAFANA_METRICS_API_KEY,
    source: process.env.GRAFANA_METRICS_SOURCE,
    url: "https://otlp-gateway-prod-us-west-0.grafana.net/otlp/v1/metrics",
    enabled: true
  },
  logging: {
    apiKey: process.env.GRAFANA_LOGGING_API_KEY,
    source: process.env.GRAFANA_METRICS_SOURCE,
    url: "https://logs-prod-021.grafana.net/loki/api/v1/push",
    enabled: true
  },
};
EOF
RUN npm ci
EXPOSE 3000
CMD ["node", "src/index.js", "3000"]
