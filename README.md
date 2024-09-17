# Apillon NFT contracts

This repo contains smart contracts that [Apillon NFT](https://app.apillon.io/dashboard) use.

## Development

> Instructions for development.

### Project setup

Create `secrets.json` with right keys

### Test

Run `npm test`.

### Build

Run `npm run build`.

### Flatten

Run `npm run flatten`.

## Deployment

> Smart contract deployment instructions.

### Apillon

Make sure the correct collecation name and symbol an URI are set.

`npx hardhat run --network moonbeamTestnet scripts/deploy-collection.js`

### Verify contract

> Note: Etherscan API-key needs to be set in hardhat config

Run `npx hardhat verify --network moonbeamTestnet <contract-address> <constructor-param1> <constructor-param2> <constructor-param3> ...`.

OR

Run `npx hardhat verify --network moonbeamTestnet <contract-address> --constructor-args ./scripts/collection-args.js`.

### Claim Token

Make sure the correct deploy arguments set in `scripts/deploy-claim-token.js`.

`npx hardhat run --network moonbeamTestnet scripts/deploy-claim-token.js`
