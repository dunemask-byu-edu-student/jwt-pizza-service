const request = require('supertest');
const app = require("../../src/service.js");
const { createDinerUser, randomPassword, randomEmail, getAdminToken, } = require("../test-util.js");
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
        const adminToken = await getAdminToken();
        const meRes = await request(app).get("/api/user/me").set("Authorization", `Bearer ${adminToken}`);
        expect(meRes.status).toBe(200);
        const adminRoleIndex = meRes.body.roles.findIndex((r) => r.role === "admin");
        expect(adminRoleIndex).not.toBe(-1);
    });

    test('admin mutate self', async () => {
        const randomUserEmail = randomEmail();
        const userData = await createDinerUser(randomUserEmail);
        expect(userData.user.id).toEqual(expect.any(Number));
        const putRes = await request(app)
            .put(`/api/user/${userData.user.id}`)
            .set("Authorization", `Bearer ${userData.token}`)
            .send({ name: "New Name" });

        expect(putRes.body.user.name).toBe("New Name");
        expect(putRes.body.user.email).toBe(randomUserEmail);
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

    test('admin list users', async () => {
        const randomUserEmail = randomEmail();
        await createDinerUser(randomUserEmail);
        const adminToken = await getAdminToken();
        const listNameRes = await request(app).get(`/api/user?name=${encodeURIComponent(randomUserEmail)}`).set("Authorization", `Bearer ${adminToken}`);
        expect(listNameRes.body.users.length).not.toBeGreaterThan(1);
        const userIndex = listNameRes.body.users.findIndex(({ email }) => email === randomUserEmail);
        expect(userIndex).not.toBe(-1);
        const listMaxRes = await request(app).get(`/api/user`).set("Authorization", `Bearer ${adminToken}`);
        expect(listMaxRes.body.users.length).toEqual(10);
        expect(listMaxRes.body.more).toBe(true);
    });

    test('admin delete user', async () => {
        const randomUserEmail = randomEmail();
        const userData = await createDinerUser(randomUserEmail);
        const adminToken = await getAdminToken();
        const deleteRes = await request(app).delete(`/api/user/${userData.user.id}`).set("Authorization", `Bearer ${adminToken}`);
        expect(deleteRes.status).toBe(200);

        const listRes = await request(app).get(`/api/user?name=${encodeURIComponent(randomUserEmail)}`).set("Authorization", `Bearer ${adminToken}`);
        expect(listRes.body.users.length).toEqual(0);

    });

});