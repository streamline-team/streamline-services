import verifyJwt from "./verify-jwt";

describe("Verify JWT Tokens", () => {
  it("should return 401 when auth header is not present", async () => {
    const verifyJwtResponse = await verifyJwt(null);

    expect(verifyJwtResponse).toStrictEqual({
      isError: true,
      code: 401,
      data: "Invalid credentials",
    });
  });

  it("should return 401 when JWT is invalid", async () => {
    const verifyJwtResponse = await verifyJwt("Bearer test");

    expect(verifyJwtResponse).toStrictEqual({
      isError: true,
      code: 401,
      data: "Unable to verify JWT",
    });
  });
});
