const express = require("express");
const { asyncHandler } = require("../endpointHelper.js");
const { DB, Role } = require("../database/database.js");
const { authRouter, setAuth } = require("./authRouter.js");

const userRouter = express.Router();

userRouter.docs = [
  {
    method: "GET",
    path: "/api/user/me",
    requiresAuth: true,
    description: "Get authenticated user",
    example: `curl -X GET localhost:3000/api/user/me -H 'Authorization: Bearer tttttt'`,
    response: {
      id: 1,
      name: "常用名字",
      email: "a@jwt.com",
      roles: [{ role: "admin" }],
    },
  },
  {
    method: "PUT",
    path: "/api/user/:userId",
    requiresAuth: true,
    description: "Update user",
    example: `curl -X PUT localhost:3000/api/user/1 -d '{"name":"常用名字", "email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'`,
    response: {
      user: {
        id: 1,
        name: "常用名字",
        email: "a@jwt.com",
        roles: [{ role: "admin" }],
      },
      token: "tttttt",
    },
  },
];

// getUser
userRouter.get(
  "/me",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(req.user);
  }),
);

userRouter.get(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const isAdmin = user.isRole(Role.Admin);
    if (!isAdmin) return res.status(403).json({ message: "unauthorized" });

    // Get query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const nameFilter = req.query.name || "";
    const { users, more } = await DB.listUsers(page, nameFilter);
    res.json({ users, more })
  }));

// updateUser
userRouter.put(
  "/:userId",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    const isSelfMutate = user.id === userId;
    const isAdmin = user.isRole(Role.Admin);
    if (!isSelfMutate && !isAdmin) return res.status(403).json({ message: "unauthorized" });

    await DB.updateUser(userId, name, email, password);
    user.name = name ?? user.name;
    user.email = email ?? user.email;

    const auth = await setAuth(user);

    res.json({ user, token: auth });
  }),
);

userRouter.delete(
  "/:userId",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = Number(req.params.userId);
    const user = req.user;
    const isAdmin = user.isRole(Role.Admin);
    if (!isAdmin) return res.status(403).json({ message: "unauthorized" });
    await DB.deleteUser(userId);
    res.sendStatus(200);

  }));



module.exports = userRouter;
