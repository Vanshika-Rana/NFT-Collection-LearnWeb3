import Head from "next/head";
import {Contract, providers, utils} from "ethers";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import React, { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import styles from '../styles/Home.module.css';

export default function Home() {
  const hero = require('../images/hero.png');

  const[walletConnected,setWalletConnected] = useState(false);
  const[presaleStarted,setPresaleStarted] = useState(false);
  const[presaleEnded,setPresaleEnded] = useState(false);
  const[loading,setLoading] = useState(false);
  const[isOwner,setIsOwner] = useState(false);
  const[tokenIdsMinted,setTokenIdsMinted] = useState("0");

  const web3ModalRef = useRef();

  const presaleMint =async () => {
    try{
        const signer = await getProviderOrSigner(true);
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.presaleMint({
          value:utils.parseEther("0.001")
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("NFT Minted!!");

    }catch(e){
      console.log(e);
    }
  }
  const publicMint =async () => {
    try{
        const signer = await getProviderOrSigner(true);
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.mint({
          value:utils.parseEther("0.001"),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("NFT Minted!!");

    }catch(e){
      console.log(e);
    }
  }
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
  const startPresale =async () => {
    try{
        const signer = await getProviderOrSigner(true);
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.startPresale();
        setLoading(true);
        await tx.wait();
        setLoading(false);

        await checkIfPresaleStarted();

    }catch(e){
      console.error(e);
    }
  }

  const checkIfPresaleStarted = async () => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _presaleStarted = await nftContract.presaleStart();
      if(!_presaleStarted){
        await getOwner();
      }

      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    }catch(e){
      console.log(e);
      return false;
    }
  }
  const checkIfPresaleEnded = async () => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _presaleEnded = await nftContract.presaleEnd();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));

      if(hasEnded){
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    }catch(e){
      console.log(e);
      return false;
    }
  }
  const getOwner = async () => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }
    }
    catch(e){
      console.log(e);
    }
  }

  const getTokenIdsMinted = async () => {
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toString());
    }
    catch(e){
      console.log(e);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId} = await web3Provider.getNetwork();
    if(chainId !== 4){
      window.alert("Please connect to the Rinkeby testnet");
      throw new Error("Please connect to the Rinkeby testnet");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {}, 
        disableInjectedProvider: false,
      });
      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();

      const presaleEndedInterval = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5*1000); 
    }
  },[walletConnected]);

  const renderButton = () => {
    if(!walletConnected){
      return (
        <button className={styles.button} onClick={connectWallet}>Connect Wallet</button>
      );
    }

    if(loading){
      return (
        <button className={styles.button} disabled>Loading...</button>
      );
    }

    if(isOwner && !presaleStarted){
      return (
        <button className={styles.button} onClick={startPresale}>Start Presale</button>
      );
    }

    if(!presaleStarted ){
      return (
        <div className={styles.description}>Presale hasnt started!</div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳<br/><br/>
            <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
          </div>
          
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint
        </button>
      );
    }
  }


  return (
    <div> 
      <style jsx global>{`
      *{
        margin: 0;
        padding: 0;
      }
      `}
      </style>
      <Head>
        <title>NFT</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <div className={styles.wrapper}>
      <div className={styles.main}>

            <div className={styles.Container}>
            <h1 className={styles.title}>Welcome to Crypto Devs !</h1>
            <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/15 have been minted.
          </div>
        <br/>
          {renderButton()}
          
          
          </div>
          <div className={styles.heroContainer}>
            <Image
            
            src={hero}
            alt="Picture of the author"
            width="300px"
            height="300px"
            
          />
            </div>
      </div>
      </div>
    </div>
  );
    
}
