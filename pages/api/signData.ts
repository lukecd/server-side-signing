import Bundlr from "@bundlr-network/client/build/node";
import type { NextApiRequest, NextApiResponse } from "next";

export async function signDataOnServer(signatureData: Buffer): Promise<Buffer> {
	// nodeJS client
	//return await serverBundlr.currencyConfig.sign(signatureData);
	// web client
	const key = process.env.SOLANA_PRIVATE_KEY; // your private key
	const serverBundlr = new Bundlr(
		"https://devnet.bundlr.network",
		"solana",
		key,
	);

	console.log("serverBundlr.address", serverBundlr.address);

	const signature = Buffer.from(
		await serverBundlr.currencyConfig.sign(
			Buffer.from(Buffer.from(signatureData).toString("hex")),
		),
	);

	return signature;
}
// req: NextApiRequest,
// res: NextApiResponse,
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const body = JSON.parse(req.body);
	console.log("body.signatureData", body.signatureData);
	const signatureData = Buffer.from(body.signatureData, "hex");
	const signature = await signDataOnServer(signatureData);
	console.log({ signatureData: signatureData.toJSON(), signature });
	res.status(200).json({ signature });
}
