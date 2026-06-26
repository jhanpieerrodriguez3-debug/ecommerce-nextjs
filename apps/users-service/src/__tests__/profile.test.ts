import request from "supertest";
import app from "../app";

describe("Profile Endpoints", () => {

  it("Debe devolver los roles disponibles", async () => {

    const response = await request(app)
      .get("/profiles/roles");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.roles.length).toBeGreaterThan(0);

  });

  it("Debe rechazar acceder al perfil sin autenticación", async () => {

    const response = await request(app)
      .get("/profiles/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);

  });

});