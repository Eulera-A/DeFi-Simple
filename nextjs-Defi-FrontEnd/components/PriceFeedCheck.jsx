"use client"
import { useEffect,useState } from "react"
import { ethers } from "ethers"
import { PriceFeed_abi } from "../constants/PriceFeed_abi.js" 
import { useMoralis,useWeb3Contract } from "react-moralis"
import { useNotification } from "web3uikit"
import {ButtonColored} from "web3uikit"

export default function PriceFeedCheck({ priceFeedAddress }) {
      const [ETH2Convert, setETH2Convert] = useState('')
      const [usdValue, setUsdValue] = useState(null)

      const {
            runContractFunction: latestRoundData,
            latestRoundData_data,
            latestRoundData_error,
            latestRoundData_isFetching,
        } = useWeb3Contract({
            abi: PriceFeed_abi,
            contractAddress: priceFeedAddress,
            functionName: 'latestRoundData',
            params: {},
        })
      
   

      
    

    const getConvertedUSD = async () => {
      try {
          const priceData = await latestRoundData()
          const ETHprice = priceData[1] // the second item is 'answer'
          const decimals = 1e8 // Chainlink price feeds usually use 8 decimals
          const USD = (ETHprice * parseFloat(ETH2Convert)*1e10) / 1e18;
          setUsdValue(USD)
      } catch (err) {
          console.error('Conversion error:', err)
          setUsdValue(null)
      }
  }


    

    
  
      return (
          <div className="p-5">
              <h3 className="text-xl font-semibold mb-4"> Eth to USD Converter Based on PriceFeed: {priceFeedAddress}</h3>
  
              <input
                  placeholder="Amount in ETH to Convert"
                  value={ETH2Convert}
                  onChange={(e) => setETH2Convert(e.target.value)}
                  className="border px-8 py-2 rounded mr-4"
              />
              <button
               onClick={getConvertedUSD} className="bg-pink-300 text-white px-4 py-2 rounded mr-2">
                  Convert to USD
              </button>

              {usdValue !== null && <p>USD Value: ${usdValue}</p>}
              {latestRoundData_error && <p>Error fetching price: {latestRoundData_error.message}</p>}
              
      
          </div>
      )}
  