const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { fulfillmentOf } = require("../server");

describe("fulfillmentOf", () => {
  it("reads the classic shipping_details location", () => {
    const { name, dest } = fulfillmentOf({
      shipping_details: {
        name: "Jane Doe",
        address: { line1: "123 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" },
      },
    });
    assert.equal(name, "Jane Doe");
    assert.equal(dest, "123 Main St, Austin, TX 78701, US");
  });

  it("falls back to collected_information", () => {
    const { name, dest } = fulfillmentOf({
      collected_information: {
        shipping_details: { name: "Jo", address: { city: "Berlin", country: "DE" } },
      },
    });
    assert.equal(name, "Jo");
    assert.equal(dest, "Berlin, DE");
  });

  it("returns empty dest instead of throwing when nothing was collected", () => {
    assert.deepEqual(fulfillmentOf({}), { name: "?", dest: "" });
  });
});
