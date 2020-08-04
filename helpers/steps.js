const validate = require('./validate');
const utils = require('./utils');
const fileutils = require('./fileutils');
const instructions = require('./manualinstructions');
const { config } = require('../config.js');



/*  ///////////////////////////////////////////////
 *
 *        Stake verification  steps
 *
 */ /// ////////////////////////////////////////////s


/* ********************************************
*
*   Step 1a create stake verification
*
*  *********************************************
*/

/**
 *
 * @param {string} stake stake address to verify
 * @param {string} payaddress string of an object with array of payto addrs and split percent
 * @param {object} options  individual key:values
 */
exports.stakeVerification = async (stake, payaddress, options) => {
  const { testnet, verbose, outputfile, method } = options;
  const isZenStake = validate.isZenAddr(stake, options);
  if (!isZenStake) return null;
  if (verbose) console.log(`VALID STAKE= ${isZenStake}`);
  const payto = validate.checkPayaddress(payaddress, options);
  if (!payto) {
    return { issue: 'Unable to process invalid payaddress. Exiting' };
  }
  if (verbose) console.log(payto);
  // create an object to hash
  const hashObj = { stake, payto };
  const [satoshis, hashSource] = utils.hashIt(hashObj);
  const amount = satoshis / 100000000;
  if (verbose) console.log('AMT=', amount);

  // eslint-disable-next-line new-cap
  const buff = new Buffer.from(hashSource);
  const request = buff.toString('base64');
  const fee = testnet ? config.testnet.defaultFee : config.mainnet.defaultFee || 0.0001;
  const stakeverifyObj = { stake, amount, satoshis, fee, request };
  if (verbose) console.log('OUTPUT CONTENTS', stakeverifyObj);

  // output to file
  let filename;
  if (outputfile) {
    filename = outputfile;
  } else {
    filename = `${stake.substring(0, 8)}_${satoshis}.json`;
  }
  stakeverifyObj.filename = filename;
  fileutils.saveFile(stakeverifyObj, filename);
  // save name of file currently being processes for next steps.
  fileutils.saveFile({ filename }, 'inprocess.json');

  if (verbose) console.log('FILE SAVED:', filename);
  if (method === 'instructions') instructions.listSendTxInstructions(stakeverifyObj, fee, config.instructionslink);

  return stakeverifyObj;
};


/* ********************************************
 *
 *   Step 1b create verification transaction
 *
 * ********************************************
 */
/**
 *
 * @param {object} stakeverification   from step 1a
 * @param {string} method  only 'zen-cli' used
 * @param {object} options  optional key:value items
 */
exports.buildTx = async (stakeverification, method, options) => {
  const { testnet, outputfile, verbose } = options;
  const data = { ...stakeverification };

  const utxos = await utils.getUTXOs(data.stake, testnet);
  if (verbose) console.log('UNSPENT COUNT=', utxos.length);
  const fee = testnet ? config.testnet.defaultFee : config.mainnet.defaultFee;

  if (utxos.length === 0) {
    const sendfunds = ` Please send at least ${data.amount + fee} (amount=${data.amount} fee=${fee}) ZEN to ${data.stake} and then rerun the command.`;
    return { issue: `No unspent found. ${sendfunds} ` };
  }

  // returns an object with unspent or error
  const outs = utils.findVOUTS(utxos, data.satoshis, options);
  if (verbose) console.log('OUTS ', outs);
  if (outs.issue) {
    const msg = `${outs.issue} Amount=${data.amount} balance=${outs.bal} diff=${outs.need}. `
      + `Please send ${outs.need} + ${fee} (${outs.need + fee}) ZEN to ${data.stake}`;
    throw new Error(msg);
  }
  const feeSats = fee * 100000000;
  // create a tx object to sign
  const change = outs.sumSatoshis - data.satoshis - feeSats;
  const inputs = outs.unspent;
  const outputs = [{ address: data.stake, satoshis: data.satoshis }];
  if (change > 0) outputs.push({ address: data.stake, satoshis: change });

  if (verbose) console.log('INPUTS:', inputs);
  const txObj = utils.createRawTx(inputs, outputs, testnet);
  if (verbose) console.log('RAW TX: ', txObj);
  const serializedRawTx = utils.serializeTx(txObj);
  // add info to current file data
  data.zencli_vins = inputs;
  data.txObj = txObj;
  data.serializedRawTx = serializedRawTx;

  // output to file
  const filename = outputfile || data.filename;
  fileutils.saveFile(data, filename);
  if (verbose) console.log('FILE SAVED: ', filename);

  const result = {
    stake: data.stake,
    amount: data.amount,
    satoshis: data.satoshis,
    filename,
    sumInputs: outs.sumSatoshis,
    change,
    fee,
    txObj,
    serializedRawTx,
  };
  if (method === 'zen-cli') {
    // output manual commands
    instructions.listSignRawTxInstructions(serializedRawTx, inputs);
  }

  return result;
};

/* ********************************************
 *
 *   Step 2 sign verification transaction
 *
 * ********************************************
 * */

// Step 2 code is in the separate signtxtool application


/* ********************************************
 *
 *   Step 3a send verification transaction
 *
 * ********************************************
 * */

/**
 *
 * @param {object} stakeObj  full object from stake (or other) file
 * @param {object} txSources  a source for the transaction or the transaction id
 * @param {object} options  optional key:value items
 */
exports.checkForTxidOrHex = (stakeObj, txSources, options) => {
  const { txid, signedtxhex } = txSources;
  const { verbose } = options;

  if (!txid && !stakeObj.signedTx && !signedtxhex) {
    throw new Error('No txid, signetxhex, or signedTx found. Pass in a txid or signedtxhex or sign the raw trasaction with Step 2');
  }

  // check if already sent from tool
  if (stakeObj.txid) {
    let msg;
    if (txid && stakeObj !== txid) {
      msg = 'txid found in process file and on command line and they do not match';
      return { issue: msg };
    }
    msg = `Existing txid found. Transaction already sent.  txid=${stakeObj.txid}.  Checking server.`;
    if (verbose) console.log(msg);
    return { status: 'check', txid, source: 'txid' };
  }
  if (txid) return { status: 'sent', txid };
  if (signedtxhex) return { status: 'sendtxhex', source: 'txhex' };
  return { status: 'send', source: 'stakefile' };
};

/* *******************************************************
 *
 *   Step 3a send transaction to blockchain
 *
 * *******************************************************
 * */

/**
*
* @param {object} stakeObj  full object from stake (or other) file
*
*/
exports.sendTx = async (stakeObj, testnet) => {
  const data = { ...stakeObj };
  const result = await utils.sendSignedTx(data.signedTx, testnet);
  return result;
};

/* *******************************************************
 *
 *   Step 3b send stake verification to tracking servers
 *
 * *******************************************************
 * */

/**
 *
 * @param {string} apikey  the Horizen Tracking Server API subkey
 * @param {object} stakeObj  full object from inprocess (or other) file
 * @param {string} inputFile  optional input filename or filepath/name
 * @param {object} options  optional key:value items
 */
exports.sendVerification = async (apikey, stakeObj, inputFile, options) => {
  const { outputfile, testnet, verbose } = options;
  const verification = { stake: stakeObj.stake, amount: stakeObj.amount, request: stakeObj.request, txid: stakeObj.txid };
  const response = await utils.sendVerification(apikey, verification, testnet);
  if (verbose) console.log('TRACKING SERVER RESPONSE:', response);
  const data = { ...stakeObj };
  data.confirmationStatus = response;
  // output to file
  const filename = outputfile || inputFile;
  fileutils.saveFile(data, filename);

  return response;
};