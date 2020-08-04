
module.exports.main = [
  {
    command: 'createstakeverification'.yellow,
    desc: 'Creates a stake verification request and optionally creates a raw transaction or outputs instructions to send funds',
  },
  {
    command: 'sendtxandstakeverification'.yellow,
    desc: 'Broadcasts the verification transaction to the blockchain and the verification request to the tracking server',
  },
  {
    command: 'liststakes'.yellow,
    desc: 'List stakeaddresses and their verification status',
  },
  {
    command: 'getbalance'.yellow,
    desc: 'Display confirmed balance of an address',
  }];

module.exports.createstake = [
  {
    command: '-s= | --stake=stakeaddress'.yellow,
    desc: '(required) stakeaddress to verify',
  }, {
    command: '-p= | --payaddress=\'[]\''.yellow,
    desc: '(required) JSON array of payaddress objects, see NOTES',
  }, {
    command: '-m= | --method=tool|zen-cli|instructions'.yellow,
    desc: '(optional) [default: tool] method to use to create and sign the transaction, see NOTES',
  }, {
    command: '-o= | --outputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override default filename or path/filename',
  }, {
    command: '-t  | --testnet'.yellow,
    desc: '(optional) use for interacting with testnet network and tracking system',
  }, {
    command: '-v  | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.createstakeNotes = [
  {
    command: 'Payaddress:',
    desc: 'The addresses in --payaddress need to be 1 to 5 valid transparent zen addresses. The sum of all "pct" needs to equal 1. A payaddress can be'
      + ' the same as the stakeaddress.',
  },
  {
    command: '',
    desc: 'Some platforms may not need to have quotes escaped or may not have to encapsulate the array in single quotes.',
  },
  {
    command: '',
    desc: 'Example:--payaddress=\'[{"address":"ztcXfXAdPoDtyBJhzNmC3DzUkq3r22phsbt","pct":0.6666},'
      + '{"address":"zrFzxutppvxEdjyu4QNjogBMjtC1py9Hp1S","pct":0.3334}]\'',
  },
  {
    command: '',
    desc: '',
  },
  {
    command: 'Method:',
    desc: 'Option "tool" creates a raw transaction to be used by the tool (using zencashjs) and returns transaction and verification data.',
  },
  {
    command: '',
    desc: 'Option "zen-cli" displays a zen-cli command to run manually that creates a raw transaction to sign using the zen-cli signrawtransaction command.',
  },
  {
    command: '',
    desc: 'Option "instructions" displays links to documentation on how to create the transaction '
      + 'using other methods like Sphere by Horizen or zen-cli z_sendmany.',
  },
];


module.exports.sendtx = [
  {
    command: '-a= | --apikey=apisubkey'.yellow,
    desc: '(required) a Super Node API sub key, optionally environment variable APIKEY can be used instead',
  },
  {
    command: '-i= | --inputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override default input file from previous steps',
  },
  {
    command: '-s= | --signedtxhex=mysignedtxhex'.yellow,
    desc: '(optional) [default: parsed from inputfile] hexadecimal signed serialized raw transaction, '
      + 'this is the output from a zen-cli signrawtransaction command',
  },
  {
    command: '-tx=| --txid=transactionidhex'.yellow,
    desc: '(optional) the transaction id of a signed transaction that has already been broadcasted to the network',
  },
  {
    command: '-o= | --outputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override default filename or path/filename',
  },
  {
    command: '-t  | --testnet'.yellow,
    desc: '(optional) use for interacting with testnet network and tracking system',
  },
  {
    command: '-v  | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.sendtxNotes = [
  {
    desc: 'The API key must be a sub key, not a main key. It may be obtained from your hosting provider or created '
      + 'on the API Settings page of the Tracking System.',
  },
  { desc: '' },
  {
    desc: 'If -signedtxhex is not used, the current verification file is checked for a signed raw transaction from '
      + 'the previous step and sent to the blockchain.',
  },
  { desc: '' },
  { desc: 'If -txid is used, it is assumed that the transaction has already been broadcasted to the network.' },
  { desc: '' },
  {
    desc: 'When this step completes the transaction id (txid) is written back to the verification tracking file. '
      + 'If "sendtxandstakeverification" is run again and the txid is present, the tool will check the tracking server for status.',
  },
  { desc: '' },
  { desc: 'The tracking server replies with whether the stake verification request is verified, needs to be confirmed, rejected, or if there is an error.' },
  { desc: 'The tracking system waits for a number of block conformations before changing the status to verified.' },
  { desc: 'The current status can be found by using the liststakes command or by checking the tracking server web site after setting up your API key.' },
  { desc: '' },
  {
    desc: 'There is a time limit of 24 hours in which to complete a verification process. After 24 hours, '
      + '"sendtxandstakeverification" will need to be repeated.',
  },
];

module.exports.liststakes = [
  {
    command: '-a= | --apikey=apisubkey'.yellow,
    desc: '(required) a Super Node API sub key, optionally environment variable APIKEY can be used instead',
  },
  {
    command: '-s= | --stake=stakeaddress'.yellow,
    desc: '(optional) filter by single stakeaddress',
  },
  {
    command: '-st=| --status=verified|pending'.yellow,
    desc: '(optional) filter by status',
  },
  {
    command: '-f= | --format=json|list'.yellow,
    desc: '(optional) [default: json] format the output, displays either JSON or a list of one stake and status per console line',
  },
  {
    command: '-t  | --testnet'.yellow,
    desc: '(optional) use for interacting with testnet network and tracking system',
  },
  {
    command: '-v  | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.liststakesNotes = [
  { desc: 'No optional arguments returns list of all verified stakes' },
];

module.exports.getbalance = [
  {
    command: '-s= | --stake=stakeaddress'.yellow,
    desc: '(required) the stakeaddress to show the balance of',
  },
  {
    command: '-t  | --testnet'.yellow,
    desc: '(optional) use for interacting with testnet network and tracking system',
  },
  {
    command: '-v  | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];