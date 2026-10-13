/** Explicit live testnet smoke test. Never imports or transacts on mainnet. */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {Connection, Keypair, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {OperationJournal, SigningSession, assertFinalTransactionFunds, signAndSendOperation, reconcileOperation, rebroadcastSignedOperation, UnconfirmedTransactionError, type SignedOperation, type OperationKind} from '../src/solana-operations';
import {seedFor, hasValidSystemAccountRemainder} from '../src/solana-utils';
const args=process.argv.slice(2);
const option=(name:string)=>args[args.indexOf(name)+1];
if(!args.includes('--keypair')||!args.includes('--output')) throw new Error('Usage: npx tsx scripts/testnet-smoke.ts --keypair /private/throwaway.json --output /path/report.json');
const connection=new Connection('https://api.testnet.solana.com',{commitment:'confirmed',disableRetryOnRateLimit:true,confirmTransactionInitialTimeout:60000});
assert.equal(await connection.getGenesisHash(),'4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY','Refusing to sign outside verified Solana testnet');
const guardian=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(await readFile(option('--keypair'),'utf8'))));
const profileId='brote-live-'+Date.now();
const seed=await seedFor(profileId);
const address=await PublicKey.createWithSeed(guardian.publicKey,seed,SystemProgram.programId);
const values=new Map<string,string>();
const journal=new OperationJournal({getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value)}},'brote:solana:testnet:operations:v1');
const provider={signTransaction:async(transaction:Transaction)=>{transaction.partialSign(guardian);return transaction}};
const session=new SigningSession();session.set(provider,guardian.publicKey.toBase58());
const snapshot=session.snapshot(provider,guardian.publicKey.toBase58());
const assertSession=()=>session.assert(snapshot,guardian.publicKey.toBase58());
const report:{network:string;guardian:string;profileId:string;profileAddress:string;observedAt:string;checks:any[];status:string}={network:'testnet',guardian:guardian.publicKey.toBase58(),profileId,profileAddress:address.toBase58(),observedAt:new Date().toISOString(),checks:[],status:'running'};
const record=async(name:string,data:Record<string,unknown>)=>{report.checks.push({name,...data});await writeFile(option('--output'),JSON.stringify(report,null,2));console.log(JSON.stringify({name,...data}));await new Promise(r=>setTimeout(r,1500));};
async function submit(kind:OperationKind,transaction:Transaction,lostResponse=false){
 const rpc=lostResponse?{getLatestBlockhash:connection.getLatestBlockhash.bind(connection),sendRawTransaction:async(bytes:Uint8Array)=>{await connection.sendRawTransaction(bytes);throw new Error('Injected lost RPC response after real testnet acceptance')},confirmTransaction:connection.confirmTransaction.bind(connection)}:connection;
 return signAndSendOperation({transaction,provider,guardian:guardian.publicKey,connection:rpc,assertSession,journal,save:(record:SignedOperation)=>{journal.save(record)},profileId,profileAddress:address.toBase58(),kind,beforeSign:prepared=>assertFinalTransactionFunds(prepared,guardian.publicKey,address,kind,connection)});
}
try{
 const balance=await connection.getBalance(guardian.publicKey,'confirmed');
 await record('guardian-funded',{balanceLamports:balance});assert.ok(balance>=20000000,'Testnet wallet needs a faucet balance before live tests');
 const rent=await connection.getMinimumBalanceForRentExemption(0,'confirmed');
 const created=await submit('create',new Transaction().add(SystemProgram.createAccountWithSeed({fromPubkey:guardian.publicKey,basePubkey:guardian.publicKey,newAccountPubkey:address,seed,lamports:rent,space:0,programId:SystemProgram.programId})));
 const account=await connection.getAccountInfo(address,'confirmed');assert.ok(account);assert.equal(account.data.length,0);assert.ok(account.owner.equals(SystemProgram.programId));assert.equal(account.lamports,rent);
 await record('create-profile',{signature:created.signature,state:created.state,balanceLamports:account.lamports,owner:account.owner.toBase58(),dataBytes:account.data.length});
 const deposit=await submit('deposit',new Transaction().add(SystemProgram.transfer({fromPubkey:guardian.publicKey,toPubkey:address,lamports:10000000})));
 assert.equal(await connection.getBalance(address,'confirmed'),rent+10000000);await record('deposit',{signature:deposit.signature,state:deposit.state,balanceLamports:rent+10000000});
 const wrongBase=Keypair.generate();
 const unauthorized=new Transaction().add(SystemProgram.transfer({fromPubkey:address,basePubkey:wrongBase.publicKey,toPubkey:guardian.publicKey,lamports:1000000,seed,programId:SystemProgram.programId}));
 unauthorized.feePayer=guardian.publicKey;
 const simulation=await connection.simulateTransaction(unauthorized,[guardian,wrongBase]);
 assert.ok(simulation.value.err,'A different base signer must not withdraw profile funds');
 assert.equal(await connection.getBalance(address,'confirmed'),rent+10000000);
 await record('wrong-guardian-withdrawal-rejected-on-chain',{passed:true,simulationError:simulation.value.err,broadcast:false});
 const withdraw=await submit('withdraw',new Transaction().add(SystemProgram.transfer({fromPubkey:address,basePubkey:guardian.publicKey,toPubkey:guardian.publicKey,lamports:4000000,seed,programId:SystemProgram.programId})));
 assert.equal(await connection.getBalance(address,'confirmed'),rent+6000000);await record('withdraw-to-guardian',{signature:withdraw.signature,state:withdraw.state,balanceLamports:rent+6000000});
 assert.equal(hasValidSystemAccountRemainder(rent+6000000,6000001,rent),false);await record('rent-invalid-withdrawal-rejected',{passed:true});
 const restored=new OperationJournal({getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},'brote:solana:testnet:restored:v1');restored.merge(journal.read());assert.throws(()=>restored.assertNoPending());
 for(const pending of restored.read()){const result=await reconcileOperation(pending,connection,address);assert.equal(result.state,'confirmed');restored.save({...pending,state:result.state,detail:result.detail});}
 restored.assertNoPending();await record('restore-and-rpc-reconciliation',{signatures:restored.read().map(r=>r.signature),passed:true});
 let uncertain='';try{await submit('deposit',new Transaction().add(SystemProgram.transfer({fromPubkey:guardian.publicKey,toPubkey:address,lamports:1000000})),true)}catch(error){assert.ok(error instanceof UnconfirmedTransactionError, 'Expected uncertain send; received: '+String(error));uncertain=error.signature}
 assert.ok(uncertain);assert.throws(()=>journal.assertNoPending());let pending=journal.read().find(r=>r.signature===uncertain)!;
 await rebroadcastSignedOperation(pending,connection,assertSession);
 await record('identical-bytes-rebroadcast',{signature:pending.signature,passed:true});
 for(let i=0;i<12;i++){const result=await reconcileOperation(pending,connection,address);if(result.state==='confirmed'){journal.save({...pending,state:'confirmed',detail:result.detail});break;}await new Promise(r=>setTimeout(r,1000));}
 assert.equal(journal.read().find(r=>r.signature===uncertain)?.state,'confirmed');assert.equal(await connection.getBalance(address,'confirmed'),rent+7000000);await record('lost-response-recovery',{signature:uncertain,passed:true,balanceLamports:rent+7000000});
 const close=await submit('withdraw',new Transaction().add(SystemProgram.transfer({fromPubkey:address,basePubkey:guardian.publicKey,toPubkey:guardian.publicKey,lamports:rent+7000000,seed,programId:SystemProgram.programId})));
 assert.equal(await connection.getBalance(address,'confirmed'),0);await record('withdraw-all',{signature:close.signature,state:close.state,balanceLamports:0});
 report.status='passed';await writeFile(option('--output'),JSON.stringify(report,null,2));
}catch(error){report.status='failed';await record('failure',{error:error instanceof Error?error.message:String(error)});process.exitCode=1;}
