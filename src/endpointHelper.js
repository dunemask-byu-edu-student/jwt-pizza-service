const { recordLatency, recordRequest } = require("./metrics.js");
class StatusCodeError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const asyncHandler = (fn) => async (req, res, next) => {
  recordRequest(req.method);
  const start = process.hrtime.bigint(); // high-resolution start time
  try {
    await Promise.resolve(fn(req, res, next));
  } catch (err) {
    return next(err);
  } finally {
    const end = process.hrtime.bigint();
    const latencyMs = Number(end - start) / 1_000_000; // convert nanoseconds → milliseconds
    recordLatency(latencyMs);
  }
};

module.exports = {
  asyncHandler,
  StatusCodeError,
};
