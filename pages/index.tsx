import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

import WebBundlr from "@bundlr-network/client/build/web";
import { PublicKey } from "@solana/web3.js";
import arrayBufferToBase64 from "./arrayBufferToBase64";
import base64ToArrayBuffer from "./base64ToArrayBuffer";

if (
	!process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE ||
	!process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY
) {
	throw new Error("Missing env variables.");
}

const bundlrNode = process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE;
const publicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY);

export default function Home() {
	const [message, setMessage] = useState("");
	const [uploadedURL, setUploadedURL] = useState("");
	const [fileToUpload, setFileToUpload] = useState();
	const [fileType, setFileType] = useState();

	const uploadDataBundlr = async () => {
		// public key is stored/provided to the client
		//const pubkey = await serverInit();
		const pubkey = process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY;

		// mock provider
		const provider = {
			publicKey: {
				toBuffer: () => pubkey,
				byteLength: 32,
			},
			signMessage: signDataOnServer,
		};
		const bundlr = new WebBundlr(
			"https://devnet.bundlr.network",
			"solana",
			provider,
		);
		//tags
		const tags = [
			{ name: "Type", value: "manifest" },
			{
				name: "Content-Type",
				value: "application/x.arweave-manifest+json",
			},
		];
		// example data (manifest)
		const manifest = {
			manifest: "arweave/paths",
			version: "0.1.0",
			paths: {
				"basten.jpg": {
					id: "cu2RWNO8T6t2zZ6f9FTIY5S_GY5A19jWfGp-fKBEAxk",
				},
			},
		};
		const transaction = bundlr.createTransaction(JSON.stringify(manifest), {
			tags,
		});
		// get signature data
		const signatureData = Buffer.from(await transaction.getSignatureData());

		await transaction.sign();

		// make sure isValid is true - don't worry about isSigned.
		console.log({
			isSigned: transaction.isSigned(),
			isValid: await transaction.isValid(),
		});
		// upload as normal
		const res = await transaction.upload();
		console.log(res);
	};

	const uploadDataBundlr2 = async () => {
		// mock provider
		const provider = {
			publicKey,
			signMessage: () => {
				return "serverSignature";
			},
		};
		const bundlr = new WebBundlr(bundlrNode, "solana", provider);
		await bundlr.ready();
		console.log("bundlr", bundlr);
		console.log("publicKey", publicKey);

		const transaction = bundlr.createTransaction("Hello");

		transaction.rawOwner = publicKey.toBuffer();

		console.log("valid", await transaction.isValid());

		// get signature data
		const signatureData = await transaction.getSignatureData();
		console.log("signatureData", signatureData);

		// get signed signature
		const signed = await fetch("/api/signBundlrTransaction", {
			method: "POST",
			body: JSON.stringify({
				signatureData: arrayBufferToBase64(signatureData),
				size: transaction.size,
			}),
		});
		console.log("signed=", signed);
		const json = await signed.json();

		console.log(json);

		const signature = new Uint8Array(base64ToArrayBuffer(json.signature));

		// write signed signature to transaction
		await transaction.setSignature(Buffer.from(signature));

		// check the tx is signed and valid
		console.log({
			isSigned: transaction.isSigned(),
			isValid: await transaction.isValid(),
		});

		// upload as normal
		const result = await transaction.upload();

		console.log(result);
	};

	return (
		<div
			id="about"
			className="w-full h-screen bg-background text-text pt-10"
		>
			<div className="flex flex-col items-start w-full h-full">
				<div className="pl-5 w-full">
					<div className="text-left pb-8">
						<p className="text-4xl font-bold inline border-b-4 border-secondary">
							Server-Side Signing Uploader ...
						</p>
						<p className="text-base mt-3 ml-5">
							Demo of using server-side signing to upload a file.
							<br />
						</p>
					</div>
				</div>

				<div className="w-full ">
					<div className="flex flex-col py-5 ml-10">
						<label className="pr-5 block mb-2 font-bold text-text underline decoration-secondary">
							Upload file
						</label>
						<div className="flex flex-row">
							<input
								type="file"
								onChange={uploadDataBundlr}
								className="w-1/3 px-1 py-1 block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
								multiple="single"
								name="files[]"
							/>
							<button
								className="ml-5 bg-primary hover:bg-blue-700 text-background font-bold py-1 px-3 rounded-lg"
								onClick={uploadDataBundlr}
							>
								Upload
							</button>
						</div>

						<p className="text-messageText text-sm">{message}</p>
						<p className="text-text text-sm">
							{uploadedURL && (
								<a
									className="underline"
									href={uploadedURL}
									target="_blank"
								>
									{uploadedURL}
								</a>
							)}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
