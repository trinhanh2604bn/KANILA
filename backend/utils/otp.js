const crypto = require("crypto");

function generateSixDigitOtp() {
  // 6-digit, 000000-999999. We avoid leading-zero stripping by always keeping length 6.
  const num = crypto.randomInt(0, 1000000);
  return String(num).padStart(6, "0");
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = {
  generateSixDigitOtp,
  sha256Hex,
};

