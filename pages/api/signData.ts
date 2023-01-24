import Bundlr from "@bundlr-network/client/build/node";
import type { NextApiRequest, NextApiResponse } from "next";
import HexInjectedSolanaSigner from "arbundles/src/signing/chains/HexInjectedSolanaSigner";
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

	console.log(
		"serverBundlrPubKey",
		//@ts-ignore
		serverBundlr.currencyConfig.getPublicKey().toJSON(),
	);

	const encodedMessage = Buffer.from(
		signatureData, //Buffer.from(signatureData).toString("hex"), // it was signing as if it were a solanaSigner, not a hexSolanaSigner. the hex conversion was done already!
	);
	console.log("signatureData.length=", signatureData.length);
	const price = await serverBundlr.getPrice(signatureData.length);
	console.log("price=", price.toString());
	await serverBundlr.fund(price);
	console.log("successfully funded");
	const signature = await serverBundlr.currencyConfig.sign(encodedMessage);

	const isValid = await HexInjectedSolanaSigner.verify(
		serverBundlr.currencyConfig.getPublicKey() as Buffer,
		signatureData,
		signature,
	);
	console.log({ isValid });

	return Buffer.from(signature);
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
	console.log({
		signatureData: signatureData.toJSON(),
		signature: signature.toJSON(),
	});
	res.status(200).json({ signature: signature.toString("hex") });
}
