"use client";
import {
	QueryClient,
	QueryClientProvider as ReactQueryProvider,
} from "@tanstack/react-query";

import React, { ReactNode } from "react";

type Props = {
	children: ReactNode;
};

const QueryClientProvider = ({ children }: Props) => {
	const client = new QueryClient();
	return <ReactQueryProvider client={client}>{children}</ReactQueryProvider>;
};

export default QueryClientProvider;
