import { config } from "dotenv";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Goerli } from "@thirdweb-dev/chains";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import { SmartWallet, SmartWalletConfig } from "@thirdweb-dev/wallets";

config();

const chain = Goerli;
const factoryAddress = "0x3c115305ecC8119D9517BB67a5B3D4073Bc9CffF";
const secretKey = process.env.THIRDWEB_SECRET_KEY as string;

const main = async () => {
  if (!secretKey) {
    throw new Error(
      "No API Key found, get one from https://thirdweb.com/dashboard"
    );
  }
  console.log("Running on", chain.slug, "with factory", factoryAddress);

  // Load or create personal wallet
  // here we generate LocalWallet that will be stored in wallet.json
  const personalWallet = new LocalWalletNode();
  await personalWallet.loadOrCreate({
    strategy: "encryptedJson",
    password: "password",
  });
  const personalWalletAddress = await personalWallet.getAddress();
  console.log("Personal wallet address:", personalWalletAddress);

  // Configure the smart wallet
  const config: SmartWalletConfig = {
    chain,
    factoryAddress,
    secretKey,
    gasless: true,
  };

  // Connect the smart wallet
  const smartWallet = new SmartWallet(config);
  await smartWallet.connect({
    personalWallet,
  });

  // now use the SDK normally to perform transactions with the smart wallet
  const sdk = await ThirdwebSDK.fromWallet(smartWallet, chain, {
    secretKey: secretKey,
  });

  console.log("Smart Account addr:", await sdk.wallet.getAddress());
  console.log("balance:", (await sdk.wallet.balance()).displayValue);

  // Claim a ERC20 token
  const contract = await sdk.getContract(
    "0xc54414e0E2DBE7E9565B75EFdC495c7eD12D3823" // TokenDrop on goerli
  );
  const tokenBalance = await contract.erc20.balance();
  console.log("ERC20 token balance:", tokenBalance.displayValue);
  const tx = await contract.erc20.claim(1);
  console.log("Claimed 1 ERC20 token, tx hash:", tx.receipt.transactionHash);
};

main();
