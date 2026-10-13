import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair,PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import {validateTransaction} from './test-wallet-server.mjs';
const genesis='4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY';
const rpc={getGenesisHash:async()=>genesis,isBlockhashValid:async()=>({value:true})};
function prepared(guardian,instruction){return new Transaction({feePayer:guardian,recentBlockhash:'11111111111111111111111111111111'}).add(instruction)}
test('QA wallet accepts actual BigInt transfer and seeded-withdrawal instructions',async()=>{
 const guardian=Keypair.generate().publicKey,seed='brote1-test';
 const profile=await PublicKey.createWithSeed(guardian,seed,SystemProgram.programId);
 await validateTransaction(prepared(guardian,SystemProgram.transfer({fromPubkey:guardian,toPubkey:profile,lamports:10000000})),guardian,rpc);
 await validateTransaction(prepared(guardian,SystemProgram.transfer({fromPubkey:profile,basePubkey:guardian,toPubkey:guardian,lamports:4000000,seed,programId:SystemProgram.programId})),guardian,rpc);
});
test('QA wallet rejects zero and over-cap transfers before signing',async()=>{
 const guardian=Keypair.generate().publicKey,destination=Keypair.generate().publicKey;
 for(const amount of [0,5000000001]) await assert.rejects(validateTransaction(prepared(guardian,SystemProgram.transfer({fromPubkey:guardian,toPubkey:destination,lamports:amount})),guardian,rpc),/Lamport amount rejected/);
});
test('QA wallet rejects another cluster and an expired blockhash',async()=>{
 const guardian=Keypair.generate().publicKey,destination=Keypair.generate().publicKey;
 const transaction=prepared(guardian,SystemProgram.transfer({fromPubkey:guardian,toPubkey:destination,lamports:1000000}));
 await assert.rejects(validateTransaction(transaction,guardian,{...rpc,getGenesisHash:async()=>'mainnet'}),/outside verified Solana testnet/);
 await assert.rejects(validateTransaction(transaction,guardian,{...rpc,isBlockhashValid:async()=>({value:false})}),/not valid on testnet/);
});
test('QA wallet rejects a seeded withdrawal from another derived address',async()=>{
 const guardian=Keypair.generate().publicKey;
 const transaction=prepared(guardian,SystemProgram.transfer({fromPubkey:Keypair.generate().publicKey,basePubkey:guardian,toPubkey:guardian,lamports:1000000,seed:'brote1-test',programId:SystemProgram.programId}));
 await assert.rejects(validateTransaction(transaction,guardian,rpc),/System instruction rejected/);
});
