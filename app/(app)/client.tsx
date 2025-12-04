"use client";

import { motion } from "framer-motion";
import { FolderListCards, SummaryCards, TableRecentFiles } from "../components";
import Link from "next/link";

export default function ClientPage() {
	return (
		<motion.div
			className="space-y-4"
			initial="hidden"
			animate="show"
			transition={{ staggerChildren: 0.1 }}
		>
			<TableRecentFiles />

			<SummaryCards />

			<h3 className="text-lg font-bold tracking-tight lg:text-xl cursor-pointer hover:text-primary">
				<Link href="/drive">Recently added folders</Link>
			</h3>

			<FolderListCards />
		</motion.div>
	);
}
