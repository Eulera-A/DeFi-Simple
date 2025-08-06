import React, { useState } from "react";
import { ethers } from "ethers";
import { FLASHLOAN_CONTRACT_ADDRESS } from "../utils/networkConfig";
import FlashloanABI from "../../artifacts/contracts/flashloan/UniswapSimpleFlashLoan.sol/UniswapSimpleFlashLoan.json";

const FlashloanForm = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const handleFlashloan = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        FLASHLOAN_CONTRACT_ADDRESS,
        FlashloanABI,
        signer
      );

      const parsedAmount = ethers.parseUnits(amount, 18);
      const tx = await contract.flashloan(
        [tokenAddress],
        [parsedAmount]
      );

      setStatus("Transaction sent. Waiting for confirmation...");
      await tx.wait();
      setStatus("Flashloan executed successfully!");
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Execute Flashloan</h2>
      <input
        type="text"
        placeholder="Token address (e.g., WETH)"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Amount (e.g., 1)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <br />
      <button onClick={handleFlashloan}>Execute Flashloan</button>
      <p>{status}</p>
    </div>
  );
};

export default FlashloanForm;
