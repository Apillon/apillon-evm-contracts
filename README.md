# Kingdom NFT contracts

This repo contains smart contracts that [Kingdom NFT] use.

## Development

> Instructions for development.

### Project setup

Copy `hardhat.sample.config.js` to `hardhat.config.js` and fill out missing data. ()

### Test

Run `npm test`.

### Build

Run `npm run build`.

### Flatten

Run `npm run flatten`.

## Deployment

> Smart contract deployment instructions.

### Kingdom

Make sure the correct collecation name and symbol an URI are set.

`npx hardhat run --network polygontestnet scripts/deploy-collection.js`

### Verify contract

> Note: Etherscan API-key needs to be set in hardhat config

Run `npx hardhat verify --network polygontestnet <contract-address> <constructor-param1> <constructor-param2> <constructor-param3> ...`.

#### OR

Run `npx hardhat verify --network polygontestnet <contract-address> --constructor-args ./scripts/collection-args.js`.
