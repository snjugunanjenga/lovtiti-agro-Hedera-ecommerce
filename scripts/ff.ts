const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");

const contract = new ethers.Contract(
  "0x0026D7d436850124Cc7DCa960F59fb3d107D5084",
  ["function products(uint256) view returns (uint price, address owner, uint stock, uint id)"],
  provider
);

(async () => {
  const product = await contract.products(16);
  console.log("price (wei):", product.price.toString());
  console.log("price (HBAR):", ethers.formatEther(product.price));
  console.log("stock:", product.stock.toString());
  console.log("owner:", product.owner);
  console.log("id:", product.id.toString());
})();
