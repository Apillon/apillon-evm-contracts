contractName=$1

if [ -z "$contractName" ]; then
  echo "Error: No argument provided. Please specify the contract name."
  exit 1
fi

networks=(
  "sepolia"
  "moonbeamTestnet"
  "astarShibuya"
  "celoAlfajores"
  "baseSepolia"
  "arbitrumSepolia"
  "avalancheFujiTestnet"
  "optimisticSepolia"
  "polygonAmoy"
)

for network in "${networks[@]}"; do
  hardhat deploy_and_verify_contract $contractName --network $network
done