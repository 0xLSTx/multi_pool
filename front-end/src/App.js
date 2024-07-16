import "./App.css";
import Header from "./components/Header";
import Swap from "./components/Swap";
import Tokens from "./components/Tokens";
import Pools from "./components/Pools";
import CreatePool from "./components/CreatePool";
import { Routes, Route } from "react-router-dom";
import { useConnect, useAccount } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";


import { Aptos } from "@aptos-labs/ts-sdk";
export const aptos = new Aptos();
export const moduleAddress = "0xbd8b83e54b80944eecb3f5c65e860a3eb84c936053c28fb73b0c0a516ddf8e7d";


function App() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });
  

  return (

    <div className="App">
      <Header connect={connect} isConnected={isConnected} address={address} />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap isConnected={isConnected} address={address} />} />
          <Route path="/create" element={<CreatePool />} />
          <Route path="/pools" element={<Pools />} />
        </Routes>
      </div>

    </div>
  )
}

export default App;
