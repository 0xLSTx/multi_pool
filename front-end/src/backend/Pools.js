import { ConsoleSqlOutlined } from "@ant-design/icons";
import { aptos } from "../App.js";
import { moduleAddress } from "../App.js";
import { useWallet, InputTransactionData, InputViewFunctionData } from "@aptos-labs/wallet-adapter-react";
import { Account } from "@aptos-labs/ts-sdk";
import { responsiveFontSizes } from "@mui/material";
import tokenList from "../tokenList.json";




export async function addLiquidity(pool, asset_amount, signAndSubmitTransaction) {
    const payload = {  
        function: `${moduleAddress}::Multi_Token_Pool::get_pool_amount_out`,
        functionArguments: [Number(pool.pool_id), Number(asset_amount[0]) * 1000000, pool.assets[0].asset.name, pool.assets[0].asset.symbol]
        
    }

    let result;
    try {
        result = (await aptos.view({ payload }))[0]; 
        console.log(result);
    } catch (error) {
        console.log(error);
        return;
    }

    console.log(result);

    const join_pool_payload = {
        data: {
            function: `${moduleAddress}::Multi_Token_Pool::join_pool`,
            functionArguments: [pool.pool_id, result, asset_amount.map((amount) => Number(1000000000000))]
        }
    }

    try {
        const response = signAndSubmitTransaction(join_pool_payload);
        return response;
    }
    catch (error) {
        console.log(error);
        return;
    }
}

export async function getTokenAmountInList(value, pool){
    console.log(pool.assets[0].asset.name,  pool.assets[0].asset.symbol, value, moduleAddress);
    const payload = {  
        function: `${moduleAddress}::Multi_Token_Pool::get_token_amount_in_list`,
        functionArguments: [pool.pool_id, Number(value) * 1000000, pool.assets[0].asset.name, pool.assets[0].asset.symbol]      
    }

    try {
        const response = await  aptos.view({ payload });
        const result = response[0]; 
        
        return result.map((value) => Number(value) / 1000000);
    }catch(error){
        console.log("Oops ", error);
        return;
    }
}

export async function getPools() {
    let payload = {
        function: `${moduleAddress}::Multi_Token_Pool::get_num_pools`,
        functionArguments: []      
    };

    let num_pools;

    try {
        num_pools = (await aptos.view({ payload }))[0]; 
        console.log(num_pools);
    } catch(error) {
        console.log(error);
        return;
    }

    console.log("Number of pools is: ", num_pools);

    let pools = [];

    // create mapping
    let list_token_m = {};
    list_token_m["Tortuga Staked Aptos"] = 0;
    list_token_m["Ditto Staked Aptos"] = 1;
    list_token_m["Thala APT"] = 2;
    list_token_m["Staked Thala APT"] = 3;
    list_token_m["Staked Aptos Coin"] = 4;


    for (let i = 1; i < num_pools; i++) {
        payload = {
            function: `${moduleAddress}::Multi_Token_Pool::get_token_name_list`,
            functionArguments: [i]
        }

        let list_token;
        let list_weight;

        try {
            const response = await aptos.view({ payload });
            list_token = response[0];

        } catch(error) {
            console.log(error);
            return;
        }

        console.log("List tokne", list_token);

        payload = {
            function: `${moduleAddress}::Multi_Token_Pool::get_token_weight_list`,
            functionArguments: [i]
        }

        try {
            const response = await aptos.view({ payload });
            list_weight = response[0];

        } catch(error) {
            console.log(error);
            return;
        }

        const assets = [];
        for (let j = 0; j < list_token.length; j++) {
            assets.push({
                asset: tokenList[list_token_m[list_token[j]]],
                weight: Number(list_weight[j]) / 10000
            });
        }
        if (assets.length === 0) continue;
        pools.push({assets, pool_id: i});
    }

    return pools;
}

function addDecimal(value, decimal){
    return value * Math.pow(10, decimal);
}

export async function createPool(assets, assetAmount, assetWeights, signAndSubmitTransaction) {
    const pool_account = Account.generate();
    console.log(pool_account.accountAddress.toString());


    const payload = {  
        function: `${moduleAddress}::Multi_Token_Pool::get_num_pools`,
        functionArguments: []
        
    }

    let pool_id;

    try {
        pool_id = (await aptos.view({ payload }))[0]; 
        console.log(pool_id);
    } catch(error) {
        console.log(error);
    }   

    pool_id = Number(pool_id);

    console.log("Pool Id is: ", pool_id);
    
    const create_pool_payload = {
        data: {
            function: `${moduleAddress}::Multi_Token_Pool::create_pool`,
            functionArguments: [pool_account.accountAddress.toString(), 30000]
        }
    };


    
    try {
        const response = await signAndSubmitTransaction(create_pool_payload);
        await aptos.waitForTransaction({transactionHash:response.hash});
    } catch(error){
        console.log(error);
        return;
    }
    console.log("============CREATE POOL SUCCESS============");

    for(let i = 0; i < assets.length; i++){
        const bind_payload = {
            data: {
                function: `${moduleAddress}::Multi_Token_Pool::bind`,
                functionArguments: [pool_id, addDecimal(assetAmount[i], 6), assetWeights[i], assets[i].name, assets[i].symbol]
            }
        };

        console.log(`============BINDING ASSET: ${assets[i].name}============`);

        try {
            const response = await signAndSubmitTransaction(bind_payload);
            await aptos.waitForTransaction({transactionHash:response.hash});
        } catch(error){
            console.log(error);
            return;
        }
        console.log(`============BINDING ASSET: ${assets[i].name}============`);
    }

    const finalize_payload = {
        data: {
            function: `${moduleAddress}::Multi_Token_Pool::finalize`,
            functionArguments: [pool_id]
        }
    };

    try {
        const response = signAndSubmitTransaction(finalize_payload);
        console.log("============FINALIZE SUCCESS============");
        return response;
    } catch(error) {
        console.log(error);
        return;
    }

    
}