import { ConnectButton } from "web3uikit";
import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";

export default function Header() {
  const [walletBalance, setWalletBalance] = useState("0");

  useEffect(() => {
    if (typeof window.ethereum === "undefined") return;

    const provider = new BrowserProvider(window.ethereum);

    const updateWalletBalance = async () => {
      try {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balance = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance));
      } catch (err) {
        console.error("Error fetching balance:", err);
        setWalletBalance("0");
      }
    };

    // Update on block (balance change)
    provider.on("block", updateWalletBalance);

    // Update on wallet connect/disconnect
    window.ethereum.on("accountsChanged", updateWalletBalance);
    window.ethereum.on("chainChanged", updateWalletBalance);

    // Initial balance fetch
    updateWalletBalance();

    // Cleanup
    return () => {
      provider.off("block", updateWalletBalance);
      window.ethereum.removeListener("accountsChanged", updateWalletBalance);
      window.ethereum.removeListener("chainChanged", updateWalletBalance);
    };
  }, []);

  return (
    <nav className="p-5 border-b-2 flex flex-row items-center justify-between">
      <h1 className="font-bold text-2xl">🪙 Eulera's Simple Aave IPool App</h1>

      <div className="flex items-center space-x-4">
        <p className="text-gray-600 font-mono text-sm">
          💰 Balance: {parseFloat(walletBalance).toFixed(4)} ETH
        </p>
        <ConnectButton moralisAuth={false} />
      </div>
    </nav>
  );
}
