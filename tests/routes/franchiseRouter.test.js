const request = require('supertest');
const app = require("../../src/service.js");
const { createDinerUser, randomPassword, randomEmail, getAdminToken, createFranshise, deleteFranchise, createStore, deleteStore, } = require("../test-util.js");
const config = require('../../src/config.js');

describe('Franchise Tests', () => {


    test("Create, List, And Delete Franchise", async () => {
        // TODO the franchise endpoint lets you attach stores from the get go, this is a security risk
        // Ceate Franchise
        const adminToken = await getAdminToken();
        const franchise = await createFranshise();

        // Ensure Franchise exists
        expect(franchise.id).toEqual(expect.any(Number));
        const listFranchiseRes = await request(app).get("/api/franchise").set("Authorization", `Bearer ${adminToken}`);
        const franchiseIndex = listFranchiseRes.body.franchises.findIndex(({ id }) => id === franchise.id);
        expect(franchiseIndex).not.toBe(-1);

        // Delete Farnchise
        await deleteFranchise(franchise.id);
    });


    test("Create, List, And Delete Franchise Stores", async () => {
        // Ceate Franchise & store
        const adminToken = await getAdminToken();
        const franchise = await createFranshise();
        const store = await createStore(franchise.id);

        const listFranchiseRes = await request(app).get("/api/franchise").set("Authorization", `Bearer ${adminToken}`);
        const fetchedFranchise = listFranchiseRes.body.franchises.find(({ id }) => id === franchise.id);
        expect(fetchedFranchise).not.toBe(undefined);
        const storeIndex = fetchedFranchise.stores.findIndex(({ id }) => id === store.id);
        expect(storeIndex).not.toBe(-1);

        // Delete Farnchise
        await deleteStore(franchise.id, store.id);
        await deleteFranchise(franchise.id);
    });
});