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
export const moduleAddress = "0x98027a4455e28781b48eb8ce0730d974f38ad5185bc3073ed2b56176f819d48f";


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
