const contract = new ethers.Contract(contractAddress, contractABI, provider);

contract.on("FlashloanExecuted", (user, assets, amounts) => {
  console.log("Flashloan executed:", user, assets, amounts);
});

contract.on("SwapExecuted", (user, fromToken, toToken, amountIn, amountOut) => {
  console.log("Swap executed:", user, fromToken, toToken, amountIn, amountOut);
});
