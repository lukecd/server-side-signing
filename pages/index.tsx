import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

import WebBundlr from "@bundlr-network/client/build/web";
import { PublicKey } from "@solana/web3.js";
import fileReaderStream from "filereader-stream";

if (
	!process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE ||
	!process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY
) {
	throw new Error("Missing env variables.");
}

const bundlrNode = process.env.NEXT_PUBLIC_BUNDLR_NETWORK_NODE;
const publicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_PUBLIC_KEY);

export default function Home() {
	const [message, setMessage] = useState<string>("");
	const [uploadedURL, setUploadedURL] = useState<string>("");
	const [fileToUpload, setFileToUpload] = useState();
	const [fileType, setFileType] = useState<string>("");

	const handleFile = async (e) => {
		setMessage("");
		const newFiles = e.target.files;
		if (newFiles.length === 0) return;

		setFileToUpload(newFiles[0]);
		setFileType(newFiles[0]["type"]);
	};

	const uploadDataBundlr = async () => {
		// public key is stored/provided to the client
		const pubKeyRes = (await (
			await fetch("/api/publicKey")
		).json()) as unknown as {
			pubKey: Buffer;
		};
		const pubKey = Buffer.from(pubKeyRes.pubKey);
		console.log("pubKey=", pubKey);
		// provider
		const provider = {
			publicKey: {
				toBuffer: () => pubKey,
				byteLength: 32,
			},
			signMessage: /* signDataOnServer(), */ async (
				message: Uint8Array,
			) => {
				let convertedMsg = Buffer.from(message).toString("hex");
				console.log({ message, convertedMsg });
				const res = await fetch("/api/signData", {
					method: "POST",
					body: JSON.stringify({
						signatureData: convertedMsg,
					}),
				});

				const { signature } = await res.json();
				const bSig = Buffer.from(signature, "hex");
				console.log("sig", bSig.toJSON());
				return bSig;
			},
		};
		console.log("provider=", provider);

		const bundlr = new WebBundlr(
			"https://devnet.bundlr.network",
			"solana",
			provider,
		);
		await bundlr.ready();
		console.log("bundlr=", bundlr);
		console.log("bundlr.address", bundlr.address);
		console.log("fileToUpload=", fileToUpload);
		const dataStream = fileReaderStream(fileToUpload);
		const tx = bundlr.createTransaction("Hello, Bundlr!", {
			tags: [{ name: "Content-Type", value: fileType }],
		});
		await tx.sign();

		console.log({ sig: tx.rawSignature, owner: tx.rawOwner });
		console.log(dataStream);
		console.log(tx.getRaw());
		// const tx = await bundlr.upload(dataStream, {
		// 	tags: [{ name: "Content-Type", value: fileType }],
		// });

		// const uploader = bundlr.uploader.chunkedUploader;
		// uploader.setBatchSize(2);
		// uploader.setChunkSize(2_000_000);
		// const tx = await uploader.uploadData(dataStream, {
		// 	tags: [{ name: "Content-Type", value: fileType }],
		// });

		console.log("signed tx=", tx);

		// make sure isValid is true - don't worry about isSigned.
		console.log({
			isSigned: tx.isSigned(),
			isValid: await tx.isValid(),
		});

		// upload as normal
		const res = await tx.upload();
		console.log(res);
		console.log(`File uploaded ==> https://arweave.net/${tx.id}`);
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
								onChange={handleFile}
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
