import Bundlr from "@bundlr-network/client/build/node";
import { NextApiRequest, NextApiResponse } from "next";

export async function serverInit(): Promise<Buffer> {
	const key = process.env.SOLANA_PRIVATE_KEY; // your private key
	const serverBundlr = new Bundlr(
		"https://devnet.bundlr.network",
		"solana",
		key,
	);
	const publicKey = serverBundlr.currencyConfig.getSigner().publicKey;
	console.log("publicKey.ts serverBundlr.address=", serverBundlr.address);
	console.log("serverInit: publicKey=", publicKey);
	return publicKey;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	res.status(200).json({ pubKey: (await serverInit()).toString("hex") });
}
