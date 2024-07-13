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
export const moduleAddress = "0xb2517531510ce600ca5abea3ae78efd4d3086293e42fa900937cd863228e32a5";


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
