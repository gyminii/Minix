import { auth } from "@clerk/nextjs/server";

export async function getUserId(): Promise<string | null> {
	const { userId } = await auth();
	return userId;
}
