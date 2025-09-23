const request = require('supertest');
const app = require("../../src/service.js");
const { createDinerUser, randomPassword, randomEmail, } = require("../test-util.js");
const config = require('../../src/config.js');
describe('User Router Tests', () => {
    test('auth middleware valid user', async () => {
        const randomUserEmail = randomEmail();
        const userData = await createDinerUser(randomUserEmail);
        const res = await request(app).get("/api/user/me").set("Authorization", `Bearer ${userData.token}`);
        expect(res.body.email).toBe(randomUserEmail);
    });

    test('auth middleware invalid token, user exists', async () => {
        const randomUserEmail = randomEmail();
        const res = await request(app).get("/api/user/me").set("Authorization", `Bearer badToken`);
        expect(res.status).toBe(401);
    });

    test('admin user exists', async () => {
        const email = "a@jwt.com";
        const password = config.adminPassword;
        const loginRes = await request(app).put("/api/auth",).send({ email, password });
        expect(loginRes.status).toBe(200);
        const meRes = await request(app).get("/api/user/me").set("Authorization", `Bearer ${loginRes.body.token}`);
        expect(meRes.status).toBe(200);
        const adminRoleIndex = meRes.body.roles.findIndex((r) => r.role === "admin");
        expect(adminRoleIndex).not.toBe(-1);
    });

    test('admin mutate self', async ()=>{
        const randomUserEmail = randomEmail();
        const userData = await createDinerUser(randomUserEmail);
        expect(userData.user.id).toEqual(expect.any(Number));
        console.log(userData.token);
        console.log(userData.user);
        const putRes = await request(app)
            .put(`/api/user/${userData.user.id}`)
            .set("Authorization", `Bearer ${userData.token}`)
            .send({name: "New Name"});
        console.log(putRes.status);
        console.log(putRes.body);
    });

    test('non admin cannot mutate another user', async () => {
        const randomUserEmailOne = randomEmail();
        const userDataOne = await createDinerUser(randomUserEmailOne);
        const randomUserEmailTwo = randomEmail();
        const userDataTwo = await createDinerUser(randomUserEmailTwo);

        const putRes = await request(app)
            .put(`/api/user/${userDataTwo.user.id}`)
            .set("Authorization", `Bearer ${userDataOne.token}`)
            .send({ name: "New Name" });
        expect(putRes.status).toBe(403);

    });
});