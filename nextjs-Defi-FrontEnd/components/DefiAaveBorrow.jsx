"use client"
import { useEffect, useState } from "react"
import { ethers, parseEther, parseUnits, formatUnits,BrowserProvider } from "ethers"
import { useMoralis, useWeb3Contract } from "react-moralis"
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

   
    const config = networkConfig[chainId] || {}
    const {
        IPoolAddressesProvider: poolAddressesProviderAddress,
        wethToken,
        daiToken,
        priceFeedAddress: PriceFeedContractAddress,
    } = config
console.log(`we are on chain: ${chainId}`)
console.log(`your IWeth contract will be at : ${wethToken}`)
console.log(`your daiToken contract will be at : ${daiToken}`)

    const notify = (type, message, title = "Notification") => {
        dispatch({ type, message, title, position: "topR" })
    }

    const { runContractFunction: getPool } = useWeb3Contract({
        abi: abi_IPoolAddressesProvider,
        contractAddress: poolAddressesProviderAddress,
        functionName: "getPool",
        params: {},
    })

    useEffect(() => {
        if (PriceFeedContractAddress) {
            setPriceFeedAddress(PriceFeedContractAddress)
        }
    }, [PriceFeedContractAddress])

    const { runContractFunction: getUserAccountData } = useWeb3Contract({
        abi: abi_IPool,
        contractAddress: lendingPoolAddress,
        functionName: "getUserAccountData",
        params: { user: account },
    })

    useEffect(() => {
        const fetchLendingPoolAddress = async () => {
            if (isWeb3Enabled && poolAddressesProviderAddress) {
                try {
                    const result = await getPool()
                    setLendingPoolAddress(result)
                    notify("success", "Lending pool address loaded")
                } catch (err) {
                    console.error("Failed to fetch lending pool:", err)
                    notify("error", "Could not get pool address")
                }
            }
        }

        fetchLendingPoolAddress()
    }, [isWeb3Enabled, chainId,poolAddressesProviderAddress])


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
    
           
            // console.log(`Try gettin signer...`)
            // let signer
            // try {
            //     signer = await requestSignerWithPrompt();
            // } catch (err) {
            //     if (err.code === -32002) {
            //         notify("warning", "Wallet request already pending. Check MetaMask.");
            //     } else {
            //         console.error("Wallet connect error:", err);
            //         notify("error", "Could not connect wallet");
            //     }
            //     return;
            // }

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
    const {
        runContractFunction: approveWETH
      } = useWeb3Contract({
        abi: abi_IERC20,
        contractAddress: wethToken,
        functionName: "approve",
        params: {
          spender: lendingPoolAddress,
          amount: parseEther(ethAmount || "0"),
        },
      });
      
      const {
        runContractFunction: supplyWETH
      } = useWeb3Contract({
        abi: abi_IPool,
        contractAddress: lendingPoolAddress,
        functionName: "supply",
        params: {
          asset: wethToken,
          amount: parseEther(ethAmount || "0"),
          onBehalfOf: account,
          referralCode: 0,
        },
      });
    
      const handleSupply = async () => {
        if (!ethAmount || isNaN(ethAmount)) {
          notify("warning", "Enter a valid ETH amount");
          return;
        }
      
        try {
          setStatus("Approving WETH...");
          await approveWETH();
          notify("info", "WETH approved");
      
          setStatus("Supplying WETH...");
          await supplyWETH();
          notify("success", `Supplied ${ethAmount} WETH`);
          setStatus("Supply successful!");
        } catch (error) {
          console.error(error);
          notify("error", "Supply failed");
          setStatus("Supply failed");
        }
      };
      
      const {runContractFunction:
        borrowDAI} = useWeb3Contract({
        abi: abi_IPool,
        contractAddress: lendingPoolAddress,
        functionName: "borrow",
        
    })

    const handleBorrow = async () => {
        if (!borrowAmount || isNaN(borrowAmount)) {
          notify("warning", "Enter a valid DAI amount");
          return;
        }
      
        const amountInWei = parseUnits(borrowAmount, 18);
      
        try {
          setStatus("Borrowing DAI...");
      
          await borrowDAI({
            params: {
              asset: daiToken,
              amount: amountInWei,
              interestRateMode: 2,
              referralCode: 0,
              onBehalfOf: account,
            },
          });
      
          setStatus("Borrow successful!");
          notify("success", `Borrowed ${borrowAmount} DAI`);
        } catch (error) {
          console.error(error);
          setStatus("Borrow failed");
          notify("error", "Borrow failed");
        }
      };
      

    const {runContractFunction:approveDAI} = useWeb3Contract({
        abi: abi_IERC20,
        contractAddress: daiToken,
        functionName: "approve",
        
    })

    const {runContractFunction:repayDAI} = useWeb3Contract({
        abi: abi_IPool,
        contractAddress: lendingPoolAddress,
        functionName: "repay",
    
    })

    const handleRepay = async () => {
        if (!borrowAmount || isNaN(borrowAmount)) {
            notify("warning", "Enter a valid DAI amount")
            return
        }

        const amountInWei = parseUnits(borrowAmount, 18)


        try {
            setStatus("Approving DAI...")
            await approveDAI({params: {
                spender: lendingPoolAddress,
    amount: amountInWei,
            }})
            setStatus("Repaying DAI...")
            await repayDAI({params: {
                asset: daiToken,
                amount: amountInWei,
                rateMode: 2,
                onBehalfOf: account,
            }})
            setStatus("Repay successful!")
            notify("success", `Repaid ${borrowAmount} DAI`)
        } catch (error) {
            console.error(error)
            setStatus("Repay failed")
            notify("error", "Repay failed")
        }
    }

    const handleGetUserData = async () => {
        if (!lendingPoolAddress || !account) {
            notify("warning", "Pool or account not available")
            return
        }
        try {
            //signer = await requestSignerWithPrompt();

            const lendingPoolContract = new ethers.Contract(
                lendingPoolAddress,  // The lending pool address
                abi_IPool,            // The ABI for the lending pool
                signer                // The signer (e.g., connected wallet)
            );
    
            // Call the function getUserAccountData
            const userData = await lendingPoolContract.getUserAccountData(account);
          
        console.log(userData)
            // Extract the values from the userData (array of BigNumbers)
            const totalCollateralBase = userData[0]; // totalCollateralETH
            const totalDebtBase = userData[1]; // totalDebtETH
            const availableBorrowsBase = userData[2]; // availableBorrowsETH
        
            // Format and log the values
            console.log(
              `you have ${ethers.utils.formatUnits(totalCollateralBase, 8)} USD total deposited`
            );
            console.log(
              `you have ${ethers.utils.formatUnits(totalDebtBase, 8)} USD borrowed`
            );
            console.log(
              `you can borrow ${ethers.utils.formatUnits(availableBorrowsBase, 8)} USD`
            );

            setAccountData({
                 totalCollateral: formatUnits(totalCollateralBase, 8),
                 totalDebt: formatUnits(totalDebtBase, 8),
                availableBorrow: formatUnits(availableBorrowsBase, 8),
                healthFactor: ethers.formatUnits(data.healthFactor,18)
                    })
        
            
          } catch (err) {
            console.log("❌ Failed to fetch user account data", err);
            
          }

        // try {
        //     const data = await getUserAccountData()
        //     setAccountData({
        //         totalCollateral: formatUnits(data.totalCollateralBase, 18),
        //         totalDebt: formatUnits(data.totalDebtBase, 18),
        //         availableBorrow: formatUnits(data.availableBorrowsBase, 18),
        //         healthFactor: parseFloat(formatUnits(data.healthFactor, 18)).toFixed(2),
        //     })
        //     notify("info", "Fetched account data")
        // } catch (error) {
        //     console.error("Failed to get user data", error)
        //     notify("error", "Failed to get account data")
        // }
    }

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
                    <p>Total Collateral: {accountData.totalCollateral} ETH</p>
                    <p>Total Debt: {accountData.totalDebt} ETH</p>
                    <p>Available to Borrow: {accountData.availableBorrow} ETH</p>
                    <p>Health Factor: {accountData.healthFactor}</p>
                </div>
            )}
    
            {PriceFeedContractAddress && (
                <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
                    <PriceFeedCheck priceFeedAddress={PriceFeedContractAddress} />
                </div>
            )}
        </div>
    )
}

