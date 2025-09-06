"use client";

export default function Loading() {
	return (
		<div className="flex h-screen w-full items-center justify-center">
			<div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
		</div>
	);
}
