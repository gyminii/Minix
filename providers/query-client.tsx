"use client";
import {
	QueryClient,
	QueryClientProvider as ReactQueryProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

const QueryClientProvider = ({ children }: Props) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 100000 * 60,
						retry: 1,
						refetchOnWindowFocus: true,
					},
					mutations: {
						retry: 1,
					},
				},
			})
	);

	return (
		<ReactQueryProvider client={queryClient}>{children}</ReactQueryProvider>
	);
};

export default QueryClientProvider;
