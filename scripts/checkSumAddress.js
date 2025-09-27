const { getAddress } = require("@ethersproject/address");

const rawAddress = "0x220C7a5c207B6C2F69EF4aD0d3B23C1F2DfccEd0"; // ⬅️ lowercase version
const checksummed = getAddress(rawAddress);

console.log("✅ Checksummed address:", checksummed);
console.log("✅ Check for deployment input addresses");

console.log(getAddress("0x220c7a5c207b6c2f69ef4ad0d3b23c1f2dfcced0")); // Should not throw
console.log(getAddress("0xe592427a0aece92de3edee1f18e0157c05861564")); // Should not throw
