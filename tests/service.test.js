const request = require('supertest');
const app = require("../src/service.js");

describe('Server Alive', () => {

    test('server starts', () => { });

    test('critical headers are set correctly', async () => {
        const res = await request(app).get('/livez');
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
        expect(res.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
    });
});