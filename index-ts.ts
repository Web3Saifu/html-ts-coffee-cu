import {                                      // import = bring tools from another package/file
  createWalletClient,                         // Function from Viem: creates a client for the USER'S wallet
  custom,                                     // Function from Viem: lets Viem use something like window.ethereum
  formatEther,                                // Converts Wei -> normal ETH, e.g. 1000000000000000000 -> "1"
  parseEther,                                 // Converts normal ETH -> Wei, e.g. "1" -> 1000000000000000000
  defineChain,                                // Lets us describe/configure a blockchain network
  createPublicClient,                         // Creates a client mainly for READING blockchain data
  type WalletClient,                          // TypeScript type describing what a WalletClient looks like
  type PublicClient,                          // TypeScript type describing what a PublicClient looks like
} from "viem"                                 // All of the above things come from the Viem library

import "viem/window"                          // Helps TypeScript understand window.ethereum

import { abi, contractAddress } from "./constants-ts"
// Bring abi and contractAddress from constants-ts.ts
// abi = instructions describing how to talk to the smart contract
// contractAddress = where the smart contract lives on the blockchain


const connectButton = document.getElementById("connectButton") as HTMLButtonElement
// const = create a variable that will not later point to another value
// connectButton = variable name
// document = the current HTML page
// . = "use something inside this thing"
// getElementById(...) = search the HTML page for an element with this ID
// "connectButton" = the ID we are searching for
// as HTMLButtonElement = TypeScript, treat this element as an HTML button


const fundButton = document.getElementById("fundButton") as HTMLButtonElement
// Find the HTML element with id="fundButton"
// Store that button inside the variable fundButton


const balanceButton = document.getElementById("balanceButton") as HTMLButtonElement
// Find the Balance button in the HTML page


const withdrawButton = document.getElementById("withdrawButton") as HTMLButtonElement
// Find the Withdraw button in the HTML page


const ethAmountInput = document.getElementById("ethAmount") as HTMLInputElement
// Find the input field with id="ethAmount"
// HTMLInputElement means: TypeScript, this is an INPUT field, not a button


let walletClient: WalletClient
// let = create a variable whose value CAN later be changed
// walletClient = variable name
// : WalletClient = this variable is expected to contain a WalletClient
// Nothing is stored in it yet


let publicClient: PublicClient
// Create a place for a PublicClient
// PublicClient is normally used to READ blockchain data


async function connect(): Promise<void> {
// async = this function contains operations that may require waiting
// function = we are creating a function
// connect = function name
// () = this function receives no input arguments
// : Promise<void> = it finishes asynchronously and returns no useful value
// { = start of the function body


  if (typeof window.ethereum !== "undefined") {
  // if = only run the following block when the condition is true
  // window.ethereum = Ethereum provider injected by wallets such as MetaMask
  // typeof = ask JavaScript what kind of value this is
  // "undefined" = the thing does not exist / has no defined value
  // !== = is NOT equal to
  //
  // Human language:
  // "If window.ethereum exists, continue."


    walletClient = createWalletClient({
    // Call Viem's createWalletClient function
    // Store the created client inside walletClient
    //
    // ( ) = information is being passed into the function
    // { } = we are giving the function an OBJECT containing settings


      transport: custom(window.ethereum),
      // transport = "How should this client communicate?"
      // : = give transport this value
      // custom(...) = use a custom provider
      // window.ethereum = MetaMask/browser wallet provider
      //
      // Human language:
      // "Use MetaMask as the communication method."


    })
    // End of the settings object and createWalletClient() call


    await walletClient.requestAddresses()
    // requestAddresses() asks the wallet for the user's wallet address
    // MetaMask may show a popup asking the user to connect
    // await = wait until the user accepts/rejects before continuing


    connectButton.innerHTML = "Connected"
    // connectButton = our HTML Connect button
    // .innerHTML = change the content/text shown inside that button
    // After connection, button text becomes "Connected"


  } else {
  // else = run this block when the previous if condition was false
  // In this case: window.ethereum was not found


    connectButton.innerHTML = "Please install MetaMask"
    // Change the Connect button text
    // Tell the user that an Ethereum wallet/provider is missing


  }
  // End of if/else


}
 // End of connect() function



export async function fund(): Promise<void> {
// export = allow another file/module to import and use this function
// async = this function will wait for wallet/blockchain operations
// function = create a function
// fund = function name
// Promise<void> = asynchronous function; no useful value is returned
//
// PURPOSE:
// Take the ETH amount typed by the user
// Ask MetaMask for the user's account
// Prepare the smart-contract fund() transaction
// Ask the user to sign/send it


  const ethAmount: string = ethAmountInput.value
  // ethAmount = new variable
  // : string = the value must be text
  // ethAmountInput = our HTML input field
  // .value = whatever the user typed inside it
  //
  // Example:
  // User types: 0.5
  // ethAmount becomes: "0.5"


  console.log(`Funding with ${ethAmount}...`)
  // console.log = print something in the browser developer console
  // ` ` = template string
  // ${ethAmount} = insert the value stored in ethAmount
  //
  // If user typed 0.5:
  // Console shows:
  // Funding with 0.5...


  if (typeof window.ethereum !== "undefined") {
  // Check whether an Ethereum wallet provider exists


    try {
    // try = "Try running this code"
    // If something inside fails, JavaScript jumps to catch(error)
    //
    // Why?
    // Wallet transactions can fail:
    // user rejects
    // wrong network
    // contract reverts
    // not enough ETH
    // etc.


      walletClient = createWalletClient({
      // Create a WalletClient again


        transport: custom(window.ethereum),
        // Tell WalletClient to communicate using MetaMask/window.ethereum


      })
      // WalletClient creation finished


      const addresses = await walletClient.requestAddresses()
      // Ask MetaMask for the user's connected account(s)
      // Wait for the result
      // Store the returned addresses inside "addresses"
      //
      // It may look like:
      // ["0xABC123...", "0xDEF456..."]


      const account: string = addresses[0]
      // addresses[0] = take the FIRST address from the address list
      // [0] means first item
      // Store it inside account
      //
      // Example:
      // addresses = ["0xABC", "0xDEF"]
      // account = "0xABC"


      const currentChain = await getCurrentChain(walletClient)
      // Call our getCurrentChain() function
      // Give it walletClient
      // Wait for it to discover/build the current network information
      // Store that network information in currentChain


      console.log("Processing transaction...")
      // Print a message in the browser console


      publicClient = createPublicClient({
      // Create a PublicClient
      // This one is mainly used for blockchain READ/simulation operations


        transport: custom(window.ethereum),
        // Use the same MetaMask/browser Ethereum provider for communication


      })


      const { request } = await publicClient.simulateContract({
      // simulateContract = pretend/run a simulation of the contract call FIRST
      // It checks whether the transaction should work
      //
      // await = wait for simulation result
      //
      // const { request } = ...
      // This is object destructuring
      //
      // If result looks like:
      // {
      //   request: something,
      //   result: somethingElse
      // }
      //
      // { request } means:
      // "Take only the request property and put it in a variable called request."


        address: contractAddress,
        // Which smart contract are we calling?
        // Use contractAddress from constants-ts.ts


        abi,
        // Give Viem the contract ABI
        // This tells Viem what functions exist and how to encode the call


        functionName: "fund",
        // We want to call the fund() function inside the Solidity contract


        account,
        // Which wallet account is making the transaction?
        // The user's first MetaMask account


        chain: currentChain,
        // Tell Viem which blockchain/network this transaction belongs to


        value: parseEther(ethAmount),
        // ETH value to send with the transaction
        //
        // ethAmount may be "0.5"
        // parseEther("0.5") converts it into Wei
        //
        // Solidity/EVM works with Wei, not decimal ETH


      })
      // Contract simulation configuration finished


      const hash = await walletClient.writeContract(request)
      // walletClient = user-controlled wallet client
      // writeContract = actually send a state-changing contract transaction
      // request = prepared transaction information from simulateContract()
      // await = wait for MetaMask/user/network response
      // hash = store the transaction hash
      //
      // MetaMask normally appears here asking the user to confirm


      console.log("Transaction processed: ", hash)
      // Print the transaction hash
      //
      // Example:
      // Transaction processed: 0x8ab3...


    } catch (error) {
    // If anything inside try failed, execution jumps here
    // error contains information about what went wrong


      console.error(error)
      // Print the error in the browser console


    }


  } else {
  // If window.ethereum does not exist


    fundButton.innerHTML = "Please install MetaMask"
    // Change Fund button text to tell the user MetaMask/provider is needed


  }


}



export async function getBalance(): Promise<void> {
// Function whose purpose is to READ the smart contract's ETH balance
// export = other modules can use it
// async = blockchain reading may take time
// Promise<void> = no useful value returned to the caller


  if (typeof window.ethereum !== "undefined") {
  // Make sure browser Ethereum provider exists


    try {
    // Try reading the blockchain; catch errors if something fails


      publicClient = createPublicClient({
      // Create a PublicClient because we only need to READ data


        transport: custom(window.ethereum),
        // Communicate through the browser's Ethereum provider


      })


      const balance = await publicClient.getBalance({
      // getBalance = ask the blockchain:
      // "How much native currency does this address have?"
      // Wait for the blockchain response
      // Store result in balance


        address: contractAddress,
        // Ask for the balance of our smart contract address


      })


      console.log(formatEther(balance))
      // balance comes back in Wei
      // formatEther converts Wei into readable ETH
      //
      // Example:
      // 1000000000000000000n
      // becomes
      // "1"


    } catch (error) {
    // If balance reading fails


      console.error(error)
      // Print the error


    }


  } else {
  // Ethereum provider not available


    balanceButton.innerHTML = "Please install MetaMask"
    // Change Balance button text


  }


}



export async function withdraw(): Promise<void> {
// PURPOSE:
// Call withdraw() on the smart contract
//
// This is a WRITE transaction because blockchain state/money changes.
// Therefore we need WalletClient.


  console.log("Withdrawing...")
  // Print message in browser console


  if (typeof window.ethereum !== "undefined") {
  // Continue only when an Ethereum provider exists


    try {
    // Try all transaction operations


      walletClient = createWalletClient({
      // Create the user wallet client


        transport: custom(window.ethereum),
        // Use MetaMask/browser wallet as transport


      })


      publicClient = createPublicClient({
      // Create the read/simulation client


        transport: custom(window.ethereum),
        // Use the same Ethereum provider


      })


      const addresses = await walletClient.requestAddresses()
      // Ask MetaMask for connected user account(s)


      const account: string = addresses[0]
      // Take the first wallet address


      const currentChain = await getCurrentChain(walletClient)
      // Find/configure the network currently being used


      console.log("Processing transaction...")
      // Print status


      const { request } = await publicClient.simulateContract({
      // Simulate withdraw() first
      // If simulation succeeds, get the prepared request


        account,
        // User wallet performing withdraw()


        address: contractAddress,
        // Contract we are calling


        abi,
        // Contract instructions


        functionName: "withdraw",
        // Call Solidity withdraw()


        chain: currentChain,
        // Network information


      })


      const hash = await walletClient.writeContract(request)
      // Now send the REAL withdraw transaction through the user's wallet
      // Store transaction hash


      console.log("Transaction processed: ", hash)
      // Print transaction hash


    } catch (error) {
    // Something failed


      console.error(error)
      // Show the error


    }


  } else {
  // Ethereum provider doesn't exist


    withdrawButton.innerHTML = "Please install MetaMask"
    // Tell user MetaMask/provider is required


  }


}



async function getCurrentChain(
  client: WalletClient
): Promise<ReturnType<typeof defineChain>> {
// This function figures out which blockchain chain ID the wallet currently uses
// and creates a Viem chain object for it
//
// client: WalletClient
// means:
// this function EXPECTS one input
// that input must be a WalletClient
//
// Promise<...>
// means:
// this is asynchronous and eventually gives back a result
//
// ReturnType<typeof defineChain>
// means:
// "The returned value should have the same type as whatever defineChain() returns."


  const chainId = await client.getChainId()
  // Ask the connected wallet:
  // "Which chain/network are you currently connected to?"
  //
  // Examples:
  // Ethereum mainnet = 1
  // Sepolia = 11155111
  // Anvil often = 31337


  const currentChain = defineChain({
  // Create a Viem chain description
  // Store it inside currentChain


    id: chainId,
    // Network ID received from MetaMask/wallet


    name: "Custom Chain",
    // Give this chain configuration a readable name


    nativeCurrency: {
    // Describe this network's native currency


      name: "Ether",
      // Currency name


      symbol: "ETH",
      // Currency symbol


      decimals: 18,
      // ETH uses 18 decimal places


    },


    rpcUrls: {
    // RPC = endpoint through which software talks to a blockchain node


      default: {
      // Default RPC configuration


        http: ["http://localhost:8545"],
        // Local blockchain node URL
        // Common when using Anvil/Foundry locally


      },


    },


  })


  return currentChain
  // Send currentChain back to whoever called getCurrentChain()
  //
  // Earlier:
  // const currentChain = await getCurrentChain(walletClient)
  //
  // THIS return value becomes that currentChain variable.


}



// Attach event listeners
// Now we connect HTML button clicks to our TypeScript functions


connectButton.onclick = connect
// When the user clicks the Connect button:
// run connect()


fundButton.onclick = fund
// When the user clicks Fund:
// run fund()


balanceButton.onclick = getBalance
// When the user clicks Balance:
// run getBalance()


withdrawButton.onclick = withdraw
// When the user clicks Withdraw:
// run withdraw()