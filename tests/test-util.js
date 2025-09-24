const request = require('supertest');
const config = require("../src/config.js");

const app = require("../src/service.js");

const { randomBytes } = require("node:crypto");

let httpServer;

const randomSlug = () => Math.random().toString(36).substring(2);

function randomPassword(length, charset) {
    const chars = charset ?? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=_+";
    const passwordChunks = new Array(length).fill("a");
    const randomBytesBuffer = randomBytes(Math.ceil((length * 3) / 4));
    const base = randomBytesBuffer.toString("base64"); // We'll pull the character from this, but this forces ANSI characters
    const processChunk = (_v, i) => chars.charAt(Math.floor((base.charCodeAt(i) * chars.length) / 256));
    return passwordChunks.map(processChunk).join("");
}

const randomEmail = () => `${randomSlug()}+${Date.now()}@email.com`.toLowerCase();

async function getAdminToken() {
    const email = "a@jwt.com";
    const password = config.adminPassword;
    const loginRes = await request(app).put("/api/auth",).send({ email, password });
    expect(loginRes.status).toBe(200);
    return loginRes.body.token;
}

async function createDinerUser(email = randomEmail(), password = randomPassword(12)) {
    const fixedEmail = email.toLowerCase().trim();
    const body = {
        name: fixedEmail,
        email: fixedEmail,
        password
    };

    const res = await request(app)
        .post('/api/auth')
        .send(body)
        .expect(200);
    return res.body;
}

async function createFranshise() {
    const franchiseAdminEmail = randomEmail();
    await createDinerUser(franchiseAdminEmail);
    const name = `New Franchise ${Math.floor(Date.now() / 1000)}`;
    const adminToken = await getAdminToken();
    const createFranchiseData = { name, admins: [{ email: franchiseAdminEmail }] };
    const createFranchiseRes = await request(app).post("/api/franchise").set("Authorization", `Bearer ${adminToken}`).send(createFranchiseData);
    expect(createFranchiseRes.status).toBe(200);
    return createFranchiseRes.body;
}

async function deleteFranchise(franchiseId) {
    const adminToken = await getAdminToken();
    const deleteFranchiseRes = await request(app).delete(`/api/franchise/${franchiseId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(deleteFranchiseRes.status).toBe(200);
}

async function createStore(franchiseId) {
    const name = `New Store ${Math.floor(Date.now() / 1000)}`;
    const adminToken = await getAdminToken();
    const createStoreRes = await request(app)
        .post(`/api/franchise/${franchiseId}/store`)
        .set("Authorization", `Bearer ${adminToken}`).send({ name });
    expect(createStoreRes.status).toBe(200);
    return createStoreRes.body;
}

async function deleteStore(franchiseId, storeId) {
    const adminToken = await getAdminToken();
    const createStoreRes = await request(app)
        .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
        .set("Authorization", `Bearer ${adminToken}`);
    expect(createStoreRes.status).toBe(200);
}


module.exports = {
    httpServer,
    getAdminToken,
    createDinerUser,
    createFranshise,
    deleteFranchise,
    createStore,
    deleteStore,
    randomSlug,
    randomPassword,
    randomEmail
}