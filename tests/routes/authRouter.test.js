const request = require('supertest');
const app = require("../../src/service.js");
const { createDinerUser, randomPassword, randomEmail, } = require("../test-util.js");
describe('Auth Tests', () => {

    test('Create User Works', async () => {
        const randomUserEmail = randomEmail();
        const userData = await createDinerUser(randomUserEmail);
        expect(userData.user.email).toBe(randomUserEmail);
    });

    test("login", async () => {
        const randomUserEmail = randomEmail();
        const password = randomPassword(12);
        const userData = await createDinerUser(randomUserEmail, password);
        const res = await request(app).put("/api/auth",).send({ email: randomUserEmail, password });
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(randomUserEmail);
        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        expect(res.body.token).toMatch(jwtRegex);
    });



    test('non existant user not found', async () => {
        const randomUserEmail = randomEmail();
        const res = await request(app).put("/api/auth",).send({ email: randomUserEmail, password: "password" });
        expect(res.status).toBe(404);
    });


});