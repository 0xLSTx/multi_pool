import {
    Account,
    Aptos,
    AptosConfig,
    Network,
} from "@aptos-labs/ts-sdk";

import { moduleAddress } from "../App.js";
import { aptos } from "../App.js";



export async function swap(account, tokenOne, tokenTwo, tokenOneAmount, signAndSubmitTransaction) {
    const payload = {
      function: `${moduleAddress}::Multi_Token_Pool::get_swap_exact_amount_in`,
      functionArguments: [account.address, 1, tokenOne.name, tokenOne.symbol, (Number(tokenOneAmount) * 1000000).toFixed(0), tokenTwo.name, tokenTwo.symbol, 0, 1000000000000]
    };
    let result;
    try {
      result = (await aptos.view({ payload })); 
    }
    catch (error) {
      console.log(error);
      return;
    }

    const swap_transaction = {
      data: {
        function: `${moduleAddress}::Multi_Token_Pool::swap`,
        functionArguments: [1, tokenOne.name, tokenOne.symbol, (Number(tokenOneAmount) * 1000000).toFixed(0), tokenTwo.name, tokenTwo.symbol, result[0]]
      }
    };
    console.log(tokenTwo.name);
    console.log(tokenTwo.symbol);

    // sign and submit transaction to chain
    const response = await signAndSubmitTransaction(swap_transaction);
    return response;
  }

