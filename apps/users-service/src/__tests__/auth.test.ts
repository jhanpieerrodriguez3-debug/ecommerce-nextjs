import request from "supertest";
import app from "../app";

describe("Auth Endpoints", () => {

  it("Debe rechazar login sin email ni contraseña", async () => {

    const response = await request(app)
      .post("/auth/login")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

  });

  it("Debe permitir login con usuario demo", async () => {

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@test.com",
        password: "123456"
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();

  });

  it("Debe rechazar credenciales incorrectas", async () => {

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@test.com",
        password: "incorrecta"
      });

    expect(response.status).toBe(401);

  });

  it("Debe rechazar verify sin token", async () => {

    const response = await request(app)
      .post("/auth/verify");

    expect(response.status).toBe(401);

  });

});