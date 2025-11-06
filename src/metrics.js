const config = require('./config.js');
const os = require('node:os');

const metrics = {
    latencyRecords: [],
    authRecords: [],
    pizzaLatencyRecords: [],
    pizzaRevenue: 0,
    pizzaSales: [],
    requests: {},
    loggedInCount: 0,
};


function getCpuUsagePercentage() {
    const cpuUsage = (os.loadavg()[0] / os.cpus().length) * 100;
    return parseFloat(cpuUsage.toFixed(2));
}

function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return parseFloat(memoryUsage.toFixed(2));
}

function recordLatency(latency) {
    metrics.latencyRecords.push(latency);
}

function recordPizzaLatency(latency) {
    metrics.pizzaLatencyRecords.push(latency);
}

function getLatencyAverage() {
    const latencySum = metrics.latencyRecords.reduce((a, v) => a + v, 0);
    const latencyCount = metrics.latencyRecords.length;
    const latencyAverage = latencyCount > 0 ? latencySum / latencyCount : 0;
    // Reset
    metrics.latencyRecords = [];
    return latencyAverage;
}

function getPizzaLatencyAverage() {
    const latencySum = metrics.pizzaLatencyRecords.reduce((a, v) => a + v, 0);
    const latencyCount = metrics.pizzaLatencyRecords.length;
    const latencyAverage = latencyCount > 0 ? latencySum / latencyCount : 0;
    // Reset
    metrics.pizzaLatencyRecords = [];
    return latencyAverage;
}

function recordAuthenticationAttempt(succeeded) {
    metrics.authRecords.push(succeeded);
}

function getAuthAttempts() {
    const total = metrics.authRecords.length;
    const succeeded = metrics.authRecords.filter((succeeded) => !!succeeded).length;
    metrics.authRecords = [];
    return { succeeded, failed: total - succeeded };
}

function recordPizzaSale(succeeded, revenue) {
    metrics.pizzaSales.push(succeeded);
    if (!succeeded) return;
    metrics.pizzaRevenue += revenue;
}

function getPizzaSales() {
    const total = metrics.pizzaSales.length;
    const succeeded = metrics.pizzaSales.filter((succeeded) => !!succeeded).length;
    metrics.pizzaSales = [];
    return { succeeded, failed: total - succeeded };
}

function getPizzaRevenue() {
    const revenue = metrics.pizzaRevenue;
    // metrics.pizzaRevenue = 0;
    return revenue;
}

function recordRequest(method) {
    metrics.requests[method] = (metrics.requests[method] ?? 0) + 1;
    metrics.requests.total += (metrics.requests.total ?? 0) + 1;
}

function recordLoginEvent(loggedIn) {
    metrics.loggedInCount = Math.max(metrics.loggedInCount + (loggedIn ? 1 : -1), 0);
}

function getActiveUserCount() {
    const count = metrics.loggedInCount + 0;
    metrics.loggedInCount = 0;
    return count;
}


setInterval(() => {
    // Update some fake metrics
    // collectorData.requests += Math.floor(Math.random() * 200) + 1;


    // Reset Metrics
    const { succeeded: authSuccess, failed: authFailed } = getAuthAttempts();
    const { succeeded: pizzaSuccess, failed: pizzaFailed } = getPizzaSales();
    const pizzaRevenue = getPizzaRevenue();

    const requestMetrics = Object.entries(metrics.requests).map(([method, total]) => ({ name: `http_req_${method}`, value: total, type: "sum", unit: '1' }));
    metrics.requests = {};
    // Collect all metrics at once
    const grafanaMetrics = [
        ...requestMetrics,
        // Critical
        { name: 'cpu', value: getCpuUsagePercentage(), type: 'gauge', unit: '%' },
        { name: 'memory', value: getMemoryUsagePercentage(), type: 'gauge', unit: '%' },
        // HTTP
        { name: 'requests', value: 0, type: 'sum', unit: '1' },
        { name: 'latency_avg', value: getLatencyAverage(), type: 'gauge', unit: 'ms' },
        { name: 'active_users', value: getActiveUserCount(), type: 'sum', unit: '1' },
        // Auth
        { name: 'auth_success', value: authSuccess, type: 'sum', unit: '1' },
        { name: 'auth_fail', value: authFailed, type: 'sum', unit: '1' },
        // Pizza
        { name: 'pizza_success', value: pizzaSuccess, type: 'sum', unit: '1' },
        { name: 'pizza_fail', value: pizzaFailed, type: 'sum', unit: '1' },
        { name: 'pizza_revenue', value: pizzaRevenue, type: 'sum', unit: '1' },
        { name: 'pizza_latency', value: getPizzaLatencyAverage(), type: 'gauge', unit: 'ms' },
    ];

    sendMetricsBatchToGrafana(grafanaMetrics);
}, 60_000);

function sendMetricsBatchToGrafana(metricsList) {
    const timeUnixNano = Date.now() * 1_000_000;

    const metricsPayload = metricsList.map((m) => {
        const dataPoint = { timeUnixNano, attributes: [{ key: "source", value: { stringValue: config.metrics.source } }] };
        if (Number.isInteger(m.value)) dataPoint.asInt = m.value;
        else dataPoint.asDouble = m.value;

        const metric = { name: m.name, unit: m.unit, [m.type]: { dataPoints: [dataPoint] } };
        if (m.type === 'sum') {
            metric[m.type].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
            metric[m.type].isMonotonic = true;
        }

        return metric;
    });

    const body = JSON.stringify({
        resourceMetrics: [
            {
                scopeMetrics: [
                    {
                        metrics: metricsPayload,
                    },
                ],
            },
        ],
    });

    fetch(config.metrics.url, {
        method: 'POST',
        body,
        headers: {
            Authorization: `Bearer ${config.metrics.apiKey}`,
            'Content-Type': 'application/json',
        },
    })
        .then((response) => {
            if (!response.ok) {
                response.text().then((text) => {
                    console.error(`Failed to push metrics data to Grafana: ${text}\n${body}`);
                });
            } else {
                console.log(`✅ Pushed ${metricsList.length} metrics`);
            }
        })
        .catch((error) => {
            console.error('Error pushing metrics:', error);
        });
}

module.exports = {
    recordLatency,
    recordRequest,
    recordAuthenticationAttempt,
    recordPizzaSale,
    recordPizzaLatency,
    recordLoginEvent
};
