contractName=$1

if [ -z "$contractName" ]; then
  echo "Error: No argument provided. Please specify the contract name."
  exit 1
fi

networks=(
#  "mainnet"
  "moonbeam"
  "astar"
  "sepolia"
  "base"
  "arbitrumOne"
  "avalanche"
  "optimism"
  "polygon"
)

for network in "${networks[@]}"; do
  hardhat deploy_and_verify_contract $contractName --network $network
done