const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const deployer = (await hre.ethers.getSigners())[0];

  // SET PRODUCTION DATA !!!
  const data = fs.readFileSync('./scripts/helper/vesting-data-dev.csv').toString();
  const vesting = await hre.ethers.getContractAt('ApillonVesting', '0x64c7d1C71DbaB3773003a860ec79250587932508', deployer);
  const BULK_SIZE = 50;
  // SET PRODUCTION DATA !!! [END]

  const lines = data.split('\r\n');

  const vestingDataList = [];

  const vestingTypeAr = ["PRESEED", "SEED", "COMMUNITY", "TEAM"];

  const uniqueAddress = [];

  let totalAmount = ethers.BigNumber.from(0);

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(';');

    // check vesting type
    const vestingType = vestingTypeAr.indexOf(columns[0]);
    if (vestingType < 0) {
      console.log("Wrong vestingType: " + columns[0]);
      process.exit(1);
    }

    // check address
    if(!ethers.utils.isAddress(columns[1])) {
      console.log("Invalid address: " + columns[1]);
      process.exit(1);
    }

    if (uniqueAddress.includes(columns[1].toLowerCase())) {
      console.log("Duplicate address: " + columns[1]);
      process.exit(1);
    }

    uniqueAddress.push(columns[1].toLowerCase());

    // Check months
    if (!["12","24","48"].includes(columns[2])) {
      console.log("Invalid month value: " + columns[2]);
      process.exit(1);
    }

    // Check cliff
    if (!["3","6","12"].includes(columns[3])) {
      console.log("Invalid cliff value: " + columns[3]);
      process.exit(1);
    }

    // Check non vested percent
    if (parseInt(columns[4]) < 0 || parseInt(columns[4]) > 50) {
      console.log("Invalid non vested percent: " + columns[4]);
      process.exit(1);
    }

    // Check amount
    if (ethers.utils.parseEther(columns[5]).lt(ethers.utils.parseEther("10"))) {
      console.log("Invalid amount value: " + columns[5]);
      process.exit(1);
    }

    totalAmount = totalAmount.add(ethers.utils.parseEther(columns[5]));

    vestingDataList.push({
      vestingType,
      user: columns[1],
      months: columns[2],
      cliff: columns[3],
      nonVestedPercent: columns[4],
      amount: ethers.utils.parseEther(columns[5]),
      totalDebt: 0,
      vestedDebt: 0,
    });
  }

  console.log('---------------------------------');
  console.log(`Total Amount: ${ethers.utils.formatEther(totalAmount)}`);
  console.log('---------------------------------');

  for(let i=0; i<Math.ceil(vestingDataList.length / BULK_SIZE); i++) {
    const start = BULK_SIZE * i;
    const dataAr = vestingDataList.slice(start, start + BULK_SIZE);

    console.log("Submit batch " + (i+1) + ": (" + dataAr.length + " records)");

    const tx = await vesting.setVestingData(dataAr, {gasLimit: 2000000});
    await tx.wait();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
