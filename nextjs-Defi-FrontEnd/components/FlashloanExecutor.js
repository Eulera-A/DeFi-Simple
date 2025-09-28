// components/FlashloanExecutor.js
import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import FlashloanABI from "../../artifacts/contracts/flashloan/UniswapSimpleFlashLoan.sol/UniswapFlashLoan.json";

const CONTRACT_ADDRESS = "0xC97f61D15ce51aa16D056106DF7F76aAe3c64090";

export default function FlashloanExecutor() {
  const [amount, setAmount] = useState("0.1");
  const [tokenIn, setTokenIn] = useState("0xTokenInAddress"); // e.g., WETH
  const [tokenOut, setTokenOut] = useState("0xTokenOutAddress"); // e.g., DAI
  const [txStatus, setTxStatus] = useState(null);
  const [minOut, setMinOut] = useState("0.01");

  const handleFlashloan = async () => {
    if (typeof window.ethereum === "undefined") return;

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      FlashloanABI.abi, // ✅ must access `.abi`
      signer
    );

    const amountInWei = ethers.parseEther(amount);
    const minOutWei = ethers.parseEther(minOut);

    try {
      setTxStatus("Sending transaction...");
      const tx = await contract.flashloan(
        [tokenIn],
        [amountInWei],
        tokenOut,
        minOutWei
      );

      setTxStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();
      setTxStatus("✅ Flashloan executed successfully!");
    } catch (error) {
      console.error(error);
      setTxStatus("❌ Flashloan failed: " + (error.reason || error.message));
    }
  };

  const TOKENS = {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    USDC: "0xA0b86991C6218b36c1d19D4a2e9Eb0cE3606EB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  };

  return (
    <div className="p-6 border rounded shadow-md space-y-4 max-w-xl mx-auto mt-10">
      <h2 className="text-xl font-bold">💸 Perform Flashloan</h2>

      <div className="flex flex-col space-y-2">
        <label className="text-sm">Flashloan Amount (ETH):</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded"
        />

        <label className="text-sm">Token In (Flashloan):</label>
        <select
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="border p-2 rounded font-mono"
        >
          {Object.entries(TOKENS).map(([symbol, address]) => (
            <option key={address} value={address}>
              {symbol}
            </option>
          ))}
        </select>

        <label className="text-sm">Token Out (Swapped To):</label>
        <select
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          className="border p-2 rounded font-mono"
        >
          {Object.entries(TOKENS).map(([symbol, address]) => (
            <option key={address} value={address}>
              {symbol}
            </option>
          ))}
        </select>
        <label className="text-sm">Min Amount Out (ETH):</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={minOut}
          onChange={(e) => setMinOut(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={handleFlashloan}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        🚀 Execute Flashloan
      </button>

      {txStatus && <p className="text-sm font-mono mt-4">{txStatus}</p>}
    </div>
  );
}
