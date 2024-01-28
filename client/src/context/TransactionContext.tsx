

import React, { useEffect, useState, createContext, ReactNode } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constant";

interface WindowWithEthereum extends Window {
    ethereum?: any; // Adjust the type based on the actual type of ethereum object
}

const { ethereum } = window as WindowWithEthereum;


interface Transaction {
    id: number,
    // url: str;
    addressTo: string;
    addressFrom: string;
    timestamp: string;
    message: string;
    keyword: string;
    amount: string;
}

interface TransactionsContextProps {
    value: any;
    transactionCount: number | null;
    connectWallet: () => Promise<void>;
    transactions: Transaction[];
    currentAccount: string;
    isLoading: boolean;
    sendTransaction: () => Promise<void>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void;
    formData: {
        addressTo: string;
        amount: string;
        keyword: string;
        message: string;
    };
}

export const TransactionContext = createContext<TransactionsContextProps | undefined>(undefined);


const createEthereumContract = () => {
    // const provider = new ethers.providers.Web3Providerethereum;
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

    return transactionsContract;
};

interface TransactionsProviderProps {
    children: ReactNode;
}

export const TransactionsProvider: React.FC<TransactionsProviderProps> = ({ children }) => {
    const [formData, setformData] = useState({
        addressTo: "",
        amount: "",
        keyword: "",
        message: "",
    });
    const [currentAccount, setCurrentAccount] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [transactionCount, setTransactionCount] = useState<number | null>(parseInt(localStorage.getItem("transactionCount") || '0', 10));
    const [transactions, setTransactions] = useState<Transaction[]>([{
        id: 1,
        url: "https://metro.co.uk/wp-content/uploads/2015/05/pokemon_crying.gif?quality=90&strip=all&zoom=1&resize=500%2C284",
        message: "",
        timestamp: "12/21/2021, 4:33:21 PM",
        addressFrom: "0xCF8e569A97C423952DdFf902375C7C76549A6A90",
        amount: "0.01",
        addressTo: "0x8aa395Ab97837576aF9cd6946C79024ef1acfdbE",
    }]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: string): void => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const getAllTransactions = async (): Promise<void> => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                console.log(transactionsContract);
                const availableTransactions = await transactionsContract.getAllTransactions();
                console.log("log" + availableTransactions);

                const structuredTransactions = availableTransactions.map((transaction: any) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex, 16) / 10 ** 18,
                }));

                console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum is not present");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const checkIfWalletIsConnect = async (): Promise<void> => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_accounts" });

            console.log(accounts);

            if (accounts.length) {
                setCurrentAccount(accounts[0]);

                getAllTransactions();
            } else {
                console.log("No accounts found");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const checkIfTransactionsExists = async (): Promise<void> => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();
                const currentTransactionCount = await transactionsContract.getTransactionCount();

                window.localStorage.setItem("transactionCount", currentTransactionCount.toString());
            }
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    const connectWallet = async (): Promise<void> => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });

            setCurrentAccount(accounts[0]);
            window.location.reload();
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    const sendTransaction = async (): Promise<void> => {
        try {
            // const transgetEthereumContract();
            if (ethereum) {
                const { addressTo, amount, keyword, message } = formData;
                const transactionsContract = createEthereumContract();
                const parsedAmount = ethers.parseEther(amount);
                await ethereum.request({
                    method: "eth_sendTransaction",
                    params: [
                        {
                            from: currentAccount,
                            to: addressTo,
                            gas: "0x5208",
                            value: parsedAmount.toString(),
                        },
                    ],
                });

                const transactionHash = await transactionsContract.addToBlockchain(
                    addressTo,
                    parsedAmount,
                    message,
                    keyword
                );

                setIsLoading(true);
                console.log(`Loading - ${transactionHash.hash}`);
                await transactionHash.wait();
                console.log(`Success - ${transactionHash.hash}`);
                setIsLoading(false);

                const transactionsCount = await transactionsContract.getTransactionCount();

                setTransactionCount(transactionsCount.toNumber());
                window.location.reload();
            } else {
                console.log("No ethereum object");
            }
        } catch (error) {
            console.log(error);

            // throw new Error("No ethereum objectttt");
        }
    };

    useEffect(() => {
        checkIfWalletIsConnect();
        checkIfTransactionsExists();
    }, [transactionCount]);

    // const value = " vall";

    const contextValue: TransactionsContextProps = {
        value: "some val",
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
    };

    return <TransactionContext.Provider value={contextValue}>{children}</TransactionContext.Provider>;
};
