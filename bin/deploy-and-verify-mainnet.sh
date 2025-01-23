contractName=$1

if [ -z "$contractName" ]; then
  echo "Error: No argument provided. Please specify the contract name."
  exit 1
fi

networks=(
#  "mainnet"
  "moonbeam"
  "astar"
  "celo"
  "base"
  "arbitrumOne"
  "avalanche"
  "optimisticEthereum"
  "polygon"
)

for network in "${networks[@]}"; do
  echo "----------------------------------------------"
  echo "Deploying and verifying $contractName on $network"
  echo "----------------------------------------------"
  hardhat deploy_and_verify_contract $contractName --network $network
done