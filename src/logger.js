const config = require('./config.js');

class Logger {
    httpLogger = (req, res, next) => {
        let send = res.send;
        res.send = (resBody) => {
            const logData = {
                authorized: Boolean(!!req.headers.authorization), // Ensure it's a boolean
                path: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                reqBody: "redacted",
                resBody: "redacted",
            };
            const level = this.statusToLogLevel(res.statusCode);
            this.log(level, 'http', logData);
            res.send = send;
            return res.send(resBody);
        };
        next();
    };

    log(level, type, logData) {
        const labels = { component: config.source, level: level, type: type };
        const values = [this.nowString(), this.sanitize(logData)];
        const logEvent = { streams: [{ stream: labels, values: [values] }] };

        this.sendLogToGrafana(logEvent);
    }

    statusToLogLevel(statusCode) {
        if (statusCode >= 500) return 'error';
        if (statusCode >= 400) return 'warn';
        return 'info';
    }

    nowString() {
        return (Math.floor(Date.now()) * 1000000).toString();
    }

    sanitize(logData) {
        logData = JSON.stringify(logData);
        if (logData.includes("token") || logData.includes("password")) return "redacted";
        return logData;
    }

    sendLogToGrafana(event) {
        const body = JSON.stringify(event);
        fetch(`${config.logging.url}`, {
            method: 'post',
            body: body,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.logging.apiKey}` },
        }).then((res) => {
            if (!res.ok) console.log('Failed to send log to Grafana');
        });
    }
}
module.exports = new Logger();
