const request = require('supertest');

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


module.exports = {
    httpServer,
    createDinerUser,
    randomSlug,
    randomPassword,
    randomEmail
}