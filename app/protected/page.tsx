import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function ProtectedPage() {
	const user = await getCurrentUser();
	return (
		<div className="flex h-svh w-full items-center justify-center gap-2">
			<p>
				Hello <span>{user?.email}</span>
			</p>
			<LogoutButton />
		</div>
	);
}
