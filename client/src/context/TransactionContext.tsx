

import React, { useEffect, useState, createContext, ReactNode } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constant";

interface WindowWithEthereum extends Window {
    ethereum?: any; // Adjust the type based on the actual type of ethereum object
}

const { ethereum } = window as WindowWithEthereum;


interface Transaction {
    addressTo: string;
    addressFrom: string;
    timestamp: string;
    message: string;
    keyword: string;
    amount: number;
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

// const getEthereumContract = () => {
//     // const provider = new ethers.providers.Web3Providerethereum;
//     const provider = new ethers.BrowserProvider(ethereum);
//     const signer = provider.getSigner();
//     const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);
//     console.log(provider, signer, transactionsContract)

// }
const createEthereumContract = (): ethers.Contract => {
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
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: string): void => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    const getAllTransactions = async (): Promise<void> => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();

                const availableTransactions = await transactionsContract.getAllTransactions();

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
