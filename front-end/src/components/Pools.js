import React, {useState} from "react"

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import { Input, Popover, Radio, Modal, message } from "antd";
import tokenList from "../tokenList.json";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveIcon from '@mui/icons-material/Remove';
import { useWallet, InputTransactionData, InputViewFunctionData } from "@aptos-labs/wallet-adapter-react";
import { aptos } from "../App.js";

import { Account } from "@aptos-labs/ts-sdk";
import {addLiquidity, getTokenAmountInList, getPools} from "../backend/Pools.js"
import { useEffect } from "react";
import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';


function Pools(){
    const { account, signAndSubmitTransaction } = useWallet();
    // const pools = [
    //     {
    //         assets: [
    //             {
    //                 asset: tokenList[0],
    //                 weight: 20,
    //             },
    //             {
    //                 asset: tokenList[1],
    //                 weight: 40,
    //             },
    //             {
    //                 asset: tokenList[2],
    //                 weight: 40
    //             }
    //         ],
    //         pool_id: 0
    //     },
    //     {
    //         assets: [
    //             {
    //                 asset: tokenList[0],
    //                 weight: 60,
    //             },
    //             {
    //                 asset: tokenList[2],
    //                 weight: 20,
    //             },
    //             {
    //                 asset: tokenList[4],
    //                 weight: 20,
    //             },
    //         ],
    //         pool_id: 1
    //     },
    //     {
    //         assets: [
    //             {
    //                 asset: tokenList[0],
    //                 weight: 40,
    //             },
    //             {
    //                 asset: tokenList[1],
    //                 weight: 60,
    //             },
    //         ],
    //         pool_id: 2
    //     },
    //     {
    //         assets: [
    //             {
    //                 asset: tokenList[0],
    //                 weight: 10
    //             },
    //             {
    //                 asset: tokenList[1],
    //                 weight: 20
    //             },
    //             {
    //                 asset: tokenList[2],
    //                 weight: 30
    //             },
    //             {
    //                 asset: tokenList[3],
    //                 weight: 40
    //             },
    //         ],
    //         pool_id: 3
    //     }
    // ];

    const [pools, setPools] = useState(null);
    console.log(pools);

    const [pool, setPool] = useState(null);
    const [isOpenDeposit, setIsOpenDeposit] = useState(false);
    const [isOpenWithdraw, setIsOpenWithdraw] = useState(false);
    const [assetAmount, setAssetAmount] = useState([0, 0, 0]);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        async function fetchData() {
            let result = await getPools();
            setPools(result);
            console.log(result);
            return result;
        }

        fetchData();
      }, []);
    

    async function openDeposit(pool){
        console.log("vcl");
        console.log(pool);
        setPool(pool);
        setIsOpenDeposit(true);   
        setAssetAmount(pool.assets.map((asset) => null));
    }

    function openWithdraw(pool){
        setPool(pool);
        setIsOpenWithdraw(true);
    }

    async function changeAmount(event, index) {
        console.log(index, event.target.value);
        var _assetAmount = structuredClone(assetAmount);
        _assetAmount[index] = parseFloat(event.target.value);
        console.log(typeof event.target.value);
        if(_assetAmount[index] != _assetAmount[index]){
            _assetAmount[index] = null;
        }
        
        if(_assetAmount[index] == null){
            setAssetAmount(assetAmount.map(() => null));
        }else{
            try{
                console.log("get ", parseFloat(event.target.value), pool);
                const result = await getTokenAmountInList(parseFloat(event.target.value), pool);
                console.log("Get done ", result);
                for (var i = 0; i < pool.assets.length; i++) {
                    console.log(i, result[i]);
                    if (i === index) continue;
                    _assetAmount[i] = parseFloat(result[i]);
                }
                setAssetAmount(_assetAmount);
            }catch(error){
                console.log(error);
                return;
            }
            
            // try {
                
            //     console.log("Result is: ", result);
                
            //   }
            //   catch (error) {
            //     console.log(error);
            //     return;
            //   }

        }
    }

    async function _addLiquidity(){
        const response = await addLiquidity(pool, assetAmount, signAndSubmitTransaction);
        setIsOpenDeposit(false);
        setIsOpenWithdraw(false);
        if(!response){
            messageApi.destroy();
            messageApi.open({
                type: 'error',
                content: 'Transaction Rejected',
                duration: 1.50,
            });
        }else{
            messageApi.destroy();
            messageApi.open({
                type: 'loading',
                content: 'Transaction is Pending...',
                duration: 0,
            });

            try{
                await aptos.waitForTransaction({transactionHash:response.hash});
            }catch{
                messageApi.destroy();
                messageApi.open({
                    type: 'error',
                    content: 'Transaction Failed',
                    duration: 1.50,
                });
            }
            messageApi.destroy();
            messageApi.open({
                type: 'success',
                content: 'Transaction Successful',
                duration: 1.5,
            })

            
        }
    }

    function stringifyObject(obj) {
        return JSON.stringify(obj, Object.keys(obj).sort());
      }
      function hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash |= 0; 
        }
        return hash;
      }
      
      function getObjectHash(obj) {
        const str = stringifyObject(obj);
        return hashString(str);
      }

    return (
        <div>
            {contextHolder}
            <Modal
                open={isOpenDeposit}
                footer={null}
                onCancel={() => setIsOpenDeposit(false)}
                title="Add liquidity"
            >
                <div className="modalContent" style={{paddingTop: 20}}>
                    {pool && pool.assets.map((asset, index) => (
                        <div className="inputsDeposit">
                            <Input
                                className="depositInput"
                                placeholder="0"
                                onChange={(event) => changeAmount(event, index)}
                                value={assetAmount[index]}
                            />
                            <div className="depositAsset">
                                <img src={asset.asset.img} alt="assetOneLogo" className="assetLogo" />
                                {asset.asset.ticker}
                            </div>
                        </div>
                    ))}
                    <div style={{width: "90%", margin: "0 auto"}}>
                        <div className="swapButton" style={{marginBottom: 0}} onClick={_addLiquidity}>Add liquidity</div>
                    </div>
                </div>
                
            </Modal>

            <Modal
                open={isOpenWithdraw}
                footer={null}
                onCancel={() => setIsOpenWithdraw(false)}
                title="Remove liquidity"
            >
                <div className="modalContent" style={{paddingTop: 20}}>
                    <div className="inputsDeposit">
                        <Input
                            className="depositInput"
                            placeholder="0"
                        />
                        <div className="multiAsset" >
                            {pool && pool.assets.map((asset, index) => (
                                <img
                                    src={asset.asset.img}
                                    alt="assetOneLogo"
                                    className="assetLogo"
                                    key={index}
                                    style={{ marginRight: index !== pool.assets.length - 1 ? '-12px' : '0' }}
                                />
                            ))}
                            <div>&nbsp;LP</div>
                        </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", width: "85%", margin: "0 auto", fontWeight: 500}}>
                        <div className="rowContainer" style={{fontSize: "large"}}>
                            <div>
                                Your position
                            </div>
                            <div style={{ color: "#d3d3d3"}}>
                                18518.00$ ≈ 123.00 LP
                            </div>
                        </div>     
                        <div className="rowContainer" style={{fontSize: "large", marginTop: "8px"}}>
                            <div>
                                You receive
                            </div>
                            <div style={{ color: "#d3d3d3"}}>
                                {pool && pool.assets.map((asset, index) => (
                                    <div style={{marginTop: 8, display: "flex", flexDirection:"row", gap: "4px"}}>
                                        <div>
                                            10.00
                                        </div>
                                        <div className="assetRemove">
                                            <img src={asset.asset.img} alt="assetOneLogo" className="assetLogo" />
                                            {asset.asset.ticker}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>    
                    </div>
                    <div style={{width: "90%", margin: "0 auto"}}>
                        <div className="swapButton" style={{marginBottom: 0}}>Remove liquidity</div>
                    </div>
                </div>
            </Modal>

            <div className="poolsBox">
                <div className="poolBoxHeader">
                    <h2>Pools</h2>
                </div>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                        <TableRow >
                            <TableCell sx={{maxWidth: 200}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} >Asset</TableCell>
                            <TableCell sx={{maxWidth: 50}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Pool Value</TableCell>
                            <TableCell sx={{maxWidth: 50}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Your position</TableCell>
                            <TableCell sx={{maxWidth: 40}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Volume (24h)</TableCell>
                            <TableCell sx={{maxWidth: 25}}  style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">APR</TableCell>
                            <TableCell sx={{maxWidth: 30}}  style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right"></TableCell>
                        </TableRow>
                        </TableHead>
                        
                        {pools && 
                            <TableBody>
                            {pools.map((pool, index) => (
                                <TableRow
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell sx={{maxWidth: 150}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        <div className="assetBox">
                                            {
                                                pool.assets.map((asset, index) => (
                                                    
                                                    <div style={{display: 'inline-block'}} className="assetHihi">
                                                            <div className="asset">
                                                                <img src={asset.asset.img} alt="assetOneLogo" className="assetLogo"/>
                                                                {asset.asset.ticker}
                                                                <span style={{fontSize: 14, color: "#d3d3d3"}}>
                                                                    {asset.weight}%
                                                                </span>
                                                            </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        ${Math.abs(getObjectHash(pool) % 123456)}
                                    </TableCell>
                                    <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        ${Math.abs(getObjectHash(pool) % 12345) % 1040}
                                    </TableCell>
                                    <TableCell sx={{maxWidth: 40}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        ${Math.abs(getObjectHash(pool) % 95737)}
                                    </TableCell>
                                    <TableCell sx={{maxWidth: 25}} style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        {Math.abs(getObjectHash(pool) % 345)}%
                                    </TableCell>
                                    <TableCell sx={{maxWidth: 30}}  style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                        <div style={{display: 'inline-block'}}>
                                            <div className="colContainer">
                                                <div className="generalButton" onClick={() => openDeposit(pool)}> <AddIcon/></div>
                                                <div className="generalButton" onClick={() => openWithdraw(pool)}> <RemoveIcon/></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                
                            ))}
                            </TableBody>
                        }
                    </Table>
                </TableContainer>
                <div style={{width: "100%", margin: "auto 0"}}>
                {!pools && 
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />}
                        </div>
            </div>
        </div>
    )
}

export default Pools;