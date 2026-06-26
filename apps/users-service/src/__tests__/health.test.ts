import request from "supertest";
import app from "../app";

describe("Health Endpoint", () => {

  it("debe responder 200 y devolver el estado del servicio", async () => {

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body.service).toBe("users-service");

    expect(response.body.status).toBe("healthy");

  });

});