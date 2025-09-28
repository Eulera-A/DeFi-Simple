"use client"
import { useEffect, useState, useMemo } from "react"
import { ethers, parseEther, parseUnits,BrowserProvider } from "ethers"
import { formatUnits } from '@ethersproject/units';

import { useMoralis } from "react-moralis"
import { useNotification } from "web3uikit"
import { requestSignerWithPrompt } from "../utils/web3Helpers";

import { abi_IPoolAddressesProvider } from "../constants/abi_IPoolAddressesProvider"
import { abi_IPool } from "../constants/abi_IPool"
import { abi_IERC20 } from "../constants/abi_IERC20"
import { abi_IWeth } from "../constants/abi_IWeth"

import { networkConfig } from "../utils/networkConfig"

import PriceFeedCheck from "./PriceFeedCheck"

export default function DefiAaveBorrow() {
    const [ethAmount, setEthAmount] = useState("")
    const [borrowAmount, setBorrowAmount] = useState("")
    const [status, setStatus] = useState("Idle")
    const [priceFeedAddress, setPriceFeedAddress] = useState(null)
    const [lendingPoolAddress, setLendingPoolAddress] = useState(null)
    const [accountData, setAccountData] = useState(null)
    const [signer, setSigner] = useState(null)

    const { isWeb3Enabled, chainId: chainIdHex, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const dispatch = useNotification()
    const [showPriceFeed, setShowPriceFeed] = useState(false);


   
const config = useMemo(() => networkConfig[chainId] || {}, [chainId]);

const {
    IPoolAddressesProvider: poolAddressesProviderAddress,
    wethToken,
    daiToken,
    daiEthPriceFeed: PriceFeedContractAddress,
} = config;
console.log(`we are on chain: ${chainId}`)
console.log(`your IWeth contract will be at : ${wethToken}`)
console.log(`your daiToken contract will be at : ${daiToken}`)

    const notify = (type, message, title = "Notification") => {
        dispatch({ type, message, title, position: "topR" })
    }



    useEffect(() => {
        if (PriceFeedContractAddress) {
            setPriceFeedAddress(PriceFeedContractAddress)
        }
    }, [PriceFeedContractAddress])




   useEffect(() => {
    const fetchLendingPoolAddress = async () => {
        if (isWeb3Enabled && poolAddressesProviderAddress && signer) {
            try {
              //use native ether way:
              const providerContract = new ethers.Contract(
            poolAddressesProviderAddress,
            abi_IPoolAddressesProvider,
            signer
        );

        const IPoolAddress = await providerContract.getPool(); // ✔️ Now this is a real call
  if (!IPoolAddress || IPoolAddress === ethers.ZeroAddress) {
                    throw new Error("Invalid IPool address returned.");
                }
        console.log("✅ IPoolAddress fetched:", IPoolAddress);

        setLendingPoolAddress(IPoolAddress); // this updates state

        notify("success", "Lending pool address loaded");



            } catch (err) {
                console.error("Failed to fetch lending pool:", err);
                notify("error", "Could not get pool address");
            }
        }
    };

    fetchLendingPoolAddress();
}, [isWeb3Enabled, chainId, poolAddressesProviderAddress, signer]);


    useEffect(() => {
        const fetchSigner = async () => {
          if (isWeb3Enabled && poolAddressesProviderAddress) {
            try {
              // Request the signer from the wallet
              const res_signer = await requestSignerWithPrompt();
              
              // Set the signer to state
              setSigner(res_signer);
              
              // Notify success
              notify("success", "Signer Set with the connected wallet");
            } catch (err) {
              // Handle error if signing fails
              console.error("Failed to set signer of the connected wallet:", err);
              notify("error", "Could not set signer of the wallet");
            }
          } else {
            console.log("Web3 not enabled or pool address provider not found.");
          }
        };
    
        fetchSigner();
      }, [isWeb3Enabled, chainId, poolAddressesProviderAddress]); // Re-run effect when these values change
    
    const handleWrapETH = async () => {
        try {
            if (!ethAmount || isNaN(ethAmount)) {
                notify("warning", "Enter a valid ETH amount")
                return
            }
    
           
        

            console.log(`Getting iWETH contract at ${wethToken}`);
            const weth = new ethers.Contract(wethToken, abi_IWeth, signer);
            console.log(`Successfully got iWETH contract at ${wethToken}`);
    
            setStatus("Wrapping ETH...");
            const tx = await weth.deposit({ value: parseEther(ethAmount) });
            await tx.wait();
    
            notify("success", `Wrapped ${ethAmount} ETH to WETH`);
            setStatus("ETH Wrapped Successfully");
        } catch (error) {
            console.error("Wrap ETH failed:", error);
            notify("error", "Failed to wrap ETH");
            setStatus("Wrap Failed");
        }
    };
 


      const handleApproveWETH = async () => {
  try {
    setStatus("Approving WETH...");
    const weth = new ethers.Contract(wethToken, abi_IERC20, signer);
    const tx = await weth.approve(lendingPoolAddress, parseEther(ethAmount || "0"));
    await tx.wait();
    notify("success", "WETH approved");
  } catch (error) {
    console.error("Approval failed:", error);
    notify("error", "Approval failed");
  }
};

const handleSupply = async () => {
  if (!ethAmount || isNaN(ethAmount)) {
    notify("warning", "Enter a valid ETH amount");
    return;
  }

  try {
    await handleApproveWETH(); // approve first

    const lendingPool = new ethers.Contract(lendingPoolAddress, abi_IPool, signer);
    setStatus("Supplying WETH...");
    const tx = await lendingPool.supply(
      wethToken,
      parseEther(ethAmount),
      account,
      0
    );
    await tx.wait();

    notify("success", `Supplied ${ethAmount} WETH`);
    setStatus("Supply successful!");
  } catch (error) {
    console.error("Supply failed:", error);
    notify("error", "Supply failed");
    setStatus("Supply failed");
  }
};

    
   const handleBorrow = async () => {
  if (!borrowAmount || isNaN(borrowAmount)) {
    notify("warning", "Enter a valid DAI amount");
    return;
  }

  try {
    setStatus("Borrowing DAI...");
    const lendingPool = new ethers.Contract(lendingPoolAddress, abi_IPool, signer);

    const tx = await lendingPool.borrow(
      daiToken,
      parseUnits(borrowAmount, 18),
      2, // variable interest rate mode
      0,
      account
    );

    await tx.wait();
    notify("success", `Borrowed ${borrowAmount} DAI`);
    setStatus("Borrow successful!");
  } catch (error) {
    console.error("Borrow failed:", error);
    notify("error", "Borrow failed");
    setStatus("Borrow failed");
  }
};
   
    
const handleRepay = async () => {
  if (!borrowAmount || isNaN(borrowAmount)) {
    notify("warning", "Enter a valid DAI amount");
    return;
  }

  const amountInWei = parseUnits(borrowAmount, 18);

  try {
    setStatus("Approving DAI...");
    const dai = new ethers.Contract(daiToken, abi_IERC20, signer);
    const approveTx = await dai.approve(lendingPoolAddress, amountInWei);
    await approveTx.wait();

    const lendingPool = new ethers.Contract(lendingPoolAddress, abi_IPool, signer);
    setStatus("Repaying DAI...");
    const repayTx = await lendingPool.repay(daiToken, amountInWei, 2, account);
    await repayTx.wait();

    setStatus("Repay successful!");
    notify("success", `Repaid ${borrowAmount} DAI`);
  } catch (error) {
    console.error("Repay failed:", error);
    setStatus("Repay failed");
    notify("error", "Repay failed");
  }
};

   

  

    

    

const isReady = isWeb3Enabled && account && lendingPoolAddress && signer;

const handleGetUserData = async () => {
  // fact check seeing if stuff are set up correctly
  console.log("account:", account)
console.log("lendingPoolAddress:", lendingPoolAddress)
console.log("signer:", signer)

  if (!isReady) {
    notify("warning", "Pool address or signer not ready");
    return;
  }
  try {

    // Construct contract with signer or provider
    const pool = new ethers.Contract(lendingPoolAddress, abi_IPool, signer);

    const userAddr = await signer.getAddress();
    console.log("Signer address:", userAddr);
    console.log("Account (from Moralis):", account);
    if (userAddr.toLowerCase() !== account.toLowerCase()) {
      console.warn("Signer address and Moralis account mismatch");
    }

    const userData = await pool.getUserAccountData(userAddr);
    console.log("Raw userData:", userData);

    // userData is a tuple; e.g. [totalCollateralBase, totalDebtBase, availableBorrowsBase, ..., healthFactor, ...]
    const totalCollateralBase = userData[0];
    const totalDebtBase = userData[1];
    const availableBorrowsBase = userData[2];
    const healthFactorBN = userData[5]; // often healthFactor is index 5, check your contract

    console.log(
      `Collateral: ${formatUnits(totalCollateralBase, 8)}, Debt: ${formatUnits(totalDebtBase, 8)}, Available: ${formatUnits(availableBorrowsBase, 8)}, Health: ${ethers.formatUnits(healthFactorBN, 18)}`
    );

    setAccountData({
      totalCollateral: formatUnits(totalCollateralBase, 8),
      totalDebt: formatUnits(totalDebtBase, 8),
      availableBorrow: formatUnits(availableBorrowsBase, 8),
      healthFactor: ethers.formatUnits(healthFactorBN, 18),
    });
    notify("info", "Fetched user data");
  } catch (err) {
    console.error("❌ Failed to fetch user account data:", err);
    notify("error", "Fetch user data failed");
  }
};


    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Aave Lending UI</h2>
            <p className="mb-4">Status: <span className="font-semibold">{status}</span></p>
    
            <div className="mt-4">
                <label className="block mb-1 font-semibold">ETH Amount (Wrap or Supply as WETH):</label>
                <input
                    type="number"
                    step="0.01"
                    value={ethAmount}
                    onChange={(e) => setEthAmount(e.target.value)}
                    className="border rounded px-4 py-2 w-full max-w-xs mb-3"
                    />
    
                <label className="block mb-1 font-semibold">DAI Amount to Borrow or Repay:</label>
                <input
                    type="number"
                    step="0.1"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="border rounded px-4 py-2 w-full max-w-xs mb-3"
                    />
            </div>
    
            <div className="space-y-3">
                <button onClick={handleWrapETH} className="btn btn-accent w-full">
                    Wrap ETH to WETH
                </button>
                <button onClick={handleSupply} className="btn btn-primary w-full">
                    Supply WETH to Aave
                </button>
                <button onClick={handleBorrow} className="btn btn-secondary w-full">
                    Borrow DAI from Aave
                </button>
                <button onClick={handleRepay} className="btn btn-warning w-full">
                    Repay DAI Loan
                </button>
                <button onClick={handleGetUserData} className="btn btn-info w-full">
                    Display Aave Account Info
                </button>
            </div>
    
            {accountData && (
                <div className="mt-6 p-4 border rounded bg-gray-50">
                    <h3 className="font-semibold mb-2">📊 Aave Account Data</h3>
                    <p>Total Collateral: {accountData.totalCollateral} DAI</p>
                    <p>Total Debt: {accountData.totalDebt} DAI</p>
                    <p>Available to Borrow: {accountData.availableBorrow} DAI</p>
                    <p>Health Factor: {accountData.healthFactor}</p>
                </div>
            )}

{PriceFeedContractAddress && !showPriceFeed && (
  <button
    onClick={() => setShowPriceFeed(true)}
    className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50"
  >
    📈 Show Price Feed
  </button>
)}

{PriceFeedContractAddress && showPriceFeed && (
  <div className="fixed bottom-2 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
    <div className="flex justify-between items-center mb-2">
      <span className="font-semibold text-sm">Price Feed Checker</span>
      <button
        onClick={() => setShowPriceFeed(false)}
        className="text-gray-400 hover:text-black"
      >
        ✕
      </button>
    </div>
    <PriceFeedCheck priceFeedAddress={PriceFeedContractAddress} />
  </div>
)}


    
        </div>
    )
}

