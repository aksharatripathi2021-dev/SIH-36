/**
 * Test deterministic extraction & field update behaviors
 */

const { DEMO_RECEIPTS } = require("./temp-receipt-logic");

console.log("DEMO RECEIPTS COUNT:", DEMO_RECEIPTS.length);
DEMO_RECEIPTS.forEach((d) => {
  console.log(`- ${d.id}: ${d.title} (Serial: ${d.serialNumber})`);
});
