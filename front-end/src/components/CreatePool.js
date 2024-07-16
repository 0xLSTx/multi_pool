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
import CloseIcon from '@mui/icons-material/Close';
import { useWallet, InputTransactionData, InputViewFunctionData } from "@aptos-labs/wallet-adapter-react";
import { aptos } from "../App.js";
import { moduleAddress } from "../App.js";
import { Account } from "@aptos-labs/ts-sdk";
import { createPool } from "../backend/Pools.js";

function CreatePool() {
    const [assets, setAssets] = useState([tokenList[0], tokenList[1]]);
    const [assetWeights, setAssetWeights] = useState([null, null]);
    const [assetAmount, setAssetAmount] = useState([null, null]);
    const [assetPrice, setAssetPrice] = useState([1, 1]);
    const [isOpen, setIsOpen] = useState(false);
    const [modalAsset, setModalAsset] = useState(0);
    const { account, signAndSubmitTransaction } = useWallet();
    const [messageApi, contextHolder] = message.useMessage();

    const addAsset = (newAsset) => {
        setAssets([...assets, newAsset]);
        setAssetAmount([...assetAmount, null]);
        setAssetWeights([...assetWeights, null]);
        setAssetPrice([...assetPrice, 1]);
    };

    const updateAsset = (index, newAsset) => {
        setAssets(assets.map((asset, i) => (i === index ? newAsset : asset)));
        setAssetAmount(assetAmount.map((amount, i) => (i === index ? null : amount)));
        setAssetWeights(assetWeights.map((weight, i) => (i === index ? null : weight)));
    };

    const modifyAsset = (asset) => {
        updateAsset(modalAsset, asset);
        setIsOpen(false);
    }   

    const removeAsset = (index) => {
        setAssets((prevItems) => prevItems.filter((item, i) => i !== index));
        setAssetAmount((prevItems) => prevItems.filter((item, i) => i !== index));
        setAssetWeights((prevItems) => prevItems.filter((item, i) => i !== index));
        
        setAssetPrice((prevItems) => prevItems.filter((item, i) => i !== index));
    };

    function changeWeights(e, index){
        var _assetWeights = structuredClone(assetWeights);
        _assetWeights[index] = e.target.value;

        if(_assetWeights[index] != _assetWeights[index]){
            _assetWeights[index] = null;
        }

        if(_assetWeights[index] == null || assetWeights[index] == null){
            setAssetAmount(assetAmount.map(() => null));
        }else{
            if(assetAmount[index] == null){
                setAssetWeights(_assetWeights);
                return;
            }
            var _assetAmount = assetAmount;
            for(let i = 0; i < assetAmount.length; i++){
                if(i == index) continue;
                if(_assetWeights[i] == null) continue;
                let w = _assetWeights[i];
                _assetAmount[i] = (w / _assetWeights[index]) * (assetAmount[index] * assetPrice[index]) / assetPrice[i];
            }
            setAssetAmount(_assetAmount);
        }
        setAssetWeights(_assetWeights);
    }

    function changeAmount(e, index){
        var _assetAmount = structuredClone(assetAmount);
        _assetAmount[index] =   e.target.value;

        if(_assetAmount[index] != _assetAmount[index]){
            _assetAmount[index] = null;
        }
        
        if(_assetAmount[index] == null){
            setAssetAmount(assetAmount.map(() => null));
        }else{
            console.log(e.target.value);
            if(assetWeights[index] == null){
                setAssetAmount(_assetAmount);
                return;
            }
            for(let i = 0; i < assetAmount.length; i++){
                if(i == index) continue;
                if(assetWeights[i] == null) continue;
                let w = assetWeights[i];
                _assetAmount[i] = (w / assetWeights[index]) * (_assetAmount[index] * assetPrice[index]) / assetPrice[i];
            }
            setAssetAmount(_assetAmount);
        }
    }

    function openModal(index){
        setModalAsset(index);
        setIsOpen(true);
    }
      

    function _addAsset(){
        for(const asset of tokenList){
            if(!assets.includes(asset)){
                addAsset(asset);
                return;
            }
        }
    }

    function calculatePercentage(index){
        let result = assetPrice[index] * assetAmount[index] / assetPrice.reduce((sum, price, i) => sum + price * assetAmount[i], 0);

        if(result != result) return 0;
        return (result * 100).toFixed(2);
    }

    async function _createPool(){
        const response = await createPool(assets, assetAmount, assetWeights, signAndSubmitTransaction);
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


    return (
        <div>
            {contextHolder}
            <Modal
                open={isOpen}
                footer={null}
                onCancel={() => setIsOpen(false)}
                title="Select a token"
            >
                <div className="modalContent">
                {tokenList?.map((e, i) => {
                    if(!assets.includes(e))
                    return (
                    <div
                        className="tokenChoice"
                        key={i}
                        onClick={() => modifyAsset(e)}
                    >
                        <img src={e.img} alt={e.ticker} className="tokenLogo" />
                        <div className="tokenChoiceNames">
                        <div className="tokenName">{e.name}</div>
                        <div className="tokenTicker">{e.ticker}</div>
                        </div>
                    </div>
                    );
                })}
                </div>
            </Modal>
            <div className="poolBox">
                <div className="poolBoxHeader">
                    <h2>Create Pool</h2>
                    <div className='generalButton' onClick={_addAsset} style={{marginRight: -20}}>
                        <AddIcon/>
                    </div>
                </div>
                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                        <TableRow >
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} >Asset</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">In wallet</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Weights</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Amount</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Price</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Value</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">Percent</TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right"></TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {assets.map((asset, index) => (
                            <TableRow
                            key={asset.name}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} component="th" scope="row">
                                <div style={{display: 'inline-block'}}>
                                    <div className="asset" onClick={() => openModal(index)}>
                                        <img src={asset.img} alt="assetOneLogo" className="assetLogo" style={{height: 28}}/>
                                        {asset.ticker}
                                        <KeyboardArrowDownIcon />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                10.00
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}}  align="right">
                                <Input
                                    placeholder="0"
                                    className='pool-input'
                                    value={assetWeights[index]}
                                    onChange={(event) => changeWeights(event, index)}
                                ></Input>
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                <Input
                                    placeholder="0"
                                    className='pool-input'
                                    value={assetAmount[index]}
                                    onChange={(event) => changeAmount(event, index)}
                                ></Input>
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                {assetPrice[index]}$
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                {(assetPrice[index] * assetAmount[index]).toFixed(2)}$
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                {calculatePercentage(index)}%
                            </TableCell>
                            <TableCell style={{fontSize: 16, color: 'white', fontWeight: 'bold', background: '#0E111B'}} align="right">
                                <div className='closeButton' onClick={() => removeAsset(index)}>
                                    <CloseIcon fontSize="small"/>
                                </div>
                            </TableCell>
                            </TableRow>
                            
                        ))}
                        </TableBody>
                    </Table>
                    </TableContainer>

                <div className="swapButton" onClick={_createPool}>Create Pool</div>
            </div>
        </div>
    )
}

export default CreatePool;