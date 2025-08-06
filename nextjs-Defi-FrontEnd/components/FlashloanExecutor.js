// components/FlashloanExecutor.js
import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import FlashloanABI from "../../artifacts/contracts/flashloan/UniswapSimpleFlashLoan.sol/UniswapSimpleFlashLoan.json";

const CONTRACT_ADDRESS = "0xYourContractAddressHere";

export default function FlashloanExecutor() {
  const [amount, setAmount] = useState("0.1");
  const [tokenIn, setTokenIn] = useState("0xTokenInAddress"); // e.g., WETH
  const [tokenOut, setTokenOut] = useState("0xTokenOutAddress"); // e.g., DAI
  const [txStatus, setTxStatus] = useState(null);

  const handleFlashloan = async () => {
    if (typeof window.ethereum === "undefined") return;

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      FlashloanABI,
      signer
    );

    const amountInWei = ethers.parseEther(amount);

    try {
      setTxStatus("Sending transaction...");
      const tx = await contract.flashloan(
        [tokenIn], // assets array
        [amountInWei] // amounts array
      );

      setTxStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();
      setTxStatus("✅ Flashloan executed successfully!");
    } catch (error) {
      console.error(error);
      setTxStatus("❌ Flashloan failed: " + error.reason || error.message);
    }
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

        <label className="text-sm">Token In Address (Flashloan):</label>
        <input
          type="text"
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="border p-2 rounded font-mono"
        />

        <label className="text-sm">Token Out Address (Swapped To):</label>
        <input
          type="text"
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          className="border p-2 rounded font-mono"
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
