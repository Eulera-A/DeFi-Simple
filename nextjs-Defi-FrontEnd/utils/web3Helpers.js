// utils/web3Helpers.js
import { BrowserProvider } from "ethers";

export async function getProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  } else {
    throw new Error("No wallet found");
  }
}

export async function requestSignerWithPrompt() {
  const provider = await getProvider(); // ✅ This references the function above

  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });

  if (!accounts || accounts.length === 0) {
    await window.ethereum.request({
      method: "eth_requestAccounts",
    });
  }

  return provider.getSigner();
}
