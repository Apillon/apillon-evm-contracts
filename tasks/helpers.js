async function verifyContract(hre, address, constructorArguments) {
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
    });
    console.log(`Contract verified: ${address}`);
  } catch (verificationError) {
    console.error("Verification failed:", verificationError.message);
  }
}

module.exports = {
  verifyContract,
};
