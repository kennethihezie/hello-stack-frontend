import { ChangeEvent, Component, ReactNode } from "react";
import { AppConfig, UserSession, showConnect, openContractCall } from "@stacks/connect"
import userSwr from 'swr'
/*
We're importing the network we'll be calling the transaction on 
and a utility helper from the transactions package that will help 
to encode our data in a format that the Clarity contract can understand.
*/
import { StacksMocknet, StacksMainnet, StacksTestnet } from "@stacks/network";
import { stringUtf8CV } from "@stacks/transactions";

interface IProps {

}

interface IState {
  message: string
  transactionId: string
  currentMessage: string
  userData: any
}

export default class HelloStacks extends Component<IProps, IState>{
  constructor(props: any){
    super(props);

    this.state = {
      message: '',
      transactionId: '',
      currentMessage: '',
      userData: undefined
    }
  }
  /*
  * Here we are setting up an app that needs permission to 
  * store and write data to the Stacks chain, and we are 
  * instantiating a new user session with that config option 
  * passed in.
  */
  // AppConfig which is charge of setting some config options 
  // for the wallet to read.
  appConfig = new AppConfig(['store_write'])

  // UserSession, which will actually 
  // handle the wallet authentication.
  userSession = new UserSession({ appConfig: this.appConfig })
  
  // We also need to add a few details for the Hiro wallet
  // to display to people interacting with our app. We can 
  // do that with the following line:
  appDetails = {
    name: "Hello Stacks",
    icon: "https://freesvg.org/img/1541103084.png"
  }

  //We are checking if the user have already authenticated before.  
  componentDidMount(): void {
    if(this.userSession.isSignInPending()){
      this.userSession.handlePendingSignIn().then((userData) => {
        this.setState({userData: userData})
      })
    } else if(this.userSession.isUserSignedIn()){
      this.setState({userData: this.userSession.loadUserData()})
    }
  }



  connectWallet = () => {
    /*
    * Here we are using the showConnect function to actually 
    * trigger the Hiro wallet to show up, allowing the user to
    *  authenticate. From there we are triggering a page refresh when
    *  the authentication finishes and setting the userSession variable,
    *  which handles the data for our logged in user.
    */
     showConnect({
      appDetails: this.appDetails,
      onFinish: () => window.location.reload(),
      userSession: this.userSession
     })
  }

  handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({message: e.target.value})
  }

  submitMessage = async (e: any) => {
    e.preventDefault()

    const network = new StacksTestnet()

    const options = {
      contractAddress: 'ST6KZHT37N0XARDQ4BAFG49CFKE5EA6PWRC34GA8',
      contractName: 'hello-stacks',
      functionName: 'write-message',
      functionArgs: [stringUtf8CV(this.state.message)],
      network: network,
      appDetails: this.appDetails,
      onFinish: ({ txId }: any) => this.setState({transactionId: txId })
    }

    await openContractCall(options)
  }

  handleTransactionChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({transactionId: e.target.value})
  }

  retrieveMessage = async () => {
    const retrieveMessage = await fetch(
      "https://stacks-node-api.testnet.stacks.co/extended/v1/tx/events?" + new URLSearchParams({tx_id: this.state.transactionId})
    )
    const responseJson = await retrieveMessage.json()
    this.setState({currentMessage: responseJson.events[0].contract_log.value.repr})
  }

  render(): ReactNode {
    return (
      <>
         <div className="flex flex-col justify-center items-center h-screen gap-8">
            {
              //if user is authenticated hide the connect wallet button
              !this.state.userData && (
                <button className="p-4 bg-indigo-300 rounded text-white hover:bg-indigo-500" onClick={ this.connectWallet }>
                Connect Wallet
              </button>
              )
            }

            <h1 className="text-6xl font-black">Hello Stacks</h1>

            <div className="flex flex-col gap-8">
            {
              //hide the form to submit a message if we are not authenticated.
              this.state.userData && (
                <div className="flex gap-4">
                 <input className="p-4 border border-indigo-500 rounded" placeholder="Write message here..." onChange={ this.handleMessageChange } value={ this.state.message }/>

                 <button className="p-4 indigo-500 rounded text-white bg-indigo-300 hover:bg-indigo-500" onClick={ this.submitMessage }>
                   Submit New Message
                 </button>
               </div>
              )
            }

            <div className="flex gap-4">
              <input className="p-4 border border-indigo-500 rounded" placeholder="Paste transaction ID to look up message" onChange={ this.handleTransactionChange } value={ this.state.transactionId }/>

              <button className="p-4 indigo-500 rounded text-white bg-indigo-300 hover:bg-indigo-500" onClick={ this.retrieveMessage }>
                Retrive Message
              </button>
            </div>
            </div>

            {
              this.state.currentMessage.length > 0 ? (
                <p className="text-2xl">{ this.state.currentMessage }</p>
              ) : (
                ""
              )
            }
         </div>
      </>
    )
  }
}



