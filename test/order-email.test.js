const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { orderRef, cartLines, buildOrderEmail } = require("../server");

describe("order email", () => {
  it("derives the same short ref as the success page", () => {
    assert.equal(orderRef("cs_live_b1LxRvYmZqqnjKDBMKjiWIzu"), "B1LXRVYMZQQN");
    assert.equal(orderRef("cs_test_abc"), "ABC");
  });

  it("prettifies cart metadata and skips garbage", () => {
    assert.deepEqual(cartLines("peanut-2x2,peanut-1x1"), [
      "1 × Peanut Squishy — Double trouble (2-pack) — $18.00",
      "1 × Peanut Squishy — Single — $10.00",
    ]);
    assert.deepEqual(cartLines("bogus,hacker-pricex1"), []);
  });

  it("builds a confirmation containing ref, items, and total", () => {
    const mail = buildOrderEmail({
      ref: "B1LXRVYMZQQN",
      lines: ["1 × Peanut Squishy — Single — $10.00"],
      totalCents: 1000,
      name: "Max",
      dest: "Katy, TX US",
    });
    assert.match(mail.subject, /Order confirmed/);
    assert.match(mail.text, /B1LXRVYMZQQN/);
    assert.match(mail.text, /Peanut Squishy — Single/);
    assert.match(mail.text, /\$10\.00/);
    assert.match(mail.html, /B1LXRVYMZQQN/);
  });
});
