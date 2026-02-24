const bcrypt = require('bcryptjs');

/**
 * Generates a random 6-digit numeric OTP.
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes an OTP using bcryptjs.
 */
async function hashOTP(otp) {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
}

/**
 * Compares a plaintext OTP with a stored hash.
 */
async function compareOTP(otp, hash) {
    return await bcrypt.compare(otp, hash);
}

module.exports = {
    generateOTP,
    hashOTP,
    compareOTP
};
