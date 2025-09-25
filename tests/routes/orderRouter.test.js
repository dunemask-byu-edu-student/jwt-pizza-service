const request = require('supertest');
const app = require("../../src/service.js");
const { createDinerUser, createFranshise, deleteFranchise, createStore, deleteStore, randomInt } = require("../test-util.js");
const config = require('../../src/config.js');

describe('Order Router Tests', () => {

    test("Test Get Menu", async () => {
        // Setup Store
        const franchise = await createFranshise();
        const store = await createStore(franchise.id);
        const userData = await createDinerUser();
        const menuRes = await request(app).get("/api/order/menu").set("Authorization", `Bearer ${userData.token}`);
        expect(menuRes.status).toBe(200);
        expect(Array.isArray(menuRes.body)).toBe(true);

        // Delete Farnchise
        await deleteStore(franchise.id, store.id);
        await deleteFranchise(franchise.id);
    });


    test("Test Order Menu Item", async () => {
        // Setup Store
        const franchise = await createFranshise();
        const store = await createStore(franchise.id);
        const userData = await createDinerUser();
        const menuRes = await request(app).get("/api/order/menu").set("Authorization", `Bearer ${userData.token}`);
        expect(menuRes.status).toBe(200);
        expect(Array.isArray(menuRes.body)).toBe(true);
        expect(menuRes.body.length > 0).toBe(true);
        const menuItem = menuRes.body[randomInt(menuRes.body.length - 1)];
        const orderRes = await request(app).post("/api/order").set("Authorization", `Bearer ${userData.token}`).send({
            items: [{...menuItem, menuId: menuItem.id}],
            storeId: store.id,
            franchiseId: franchise.id
        });
        expect(orderRes.status).toBe(200);
        console.log(orderRes.body);


        // Delete Farnchise
        await deleteStore(franchise.id, store.id);
        await deleteFranchise(franchise.id);
    });
});