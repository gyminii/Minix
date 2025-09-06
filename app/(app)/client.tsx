"use client";

import { motion } from "framer-motion";
import { FolderListCards, SummaryCards, TableRecentFiles } from "../components";
import Link from "next/link";

const fadeInUp = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ClientPage() {
	return (
		<motion.div
			className="space-y-4"
			initial="hidden"
			animate="show"
			transition={{ staggerChildren: 0.1 }}
		>
			<motion.div variants={fadeInUp}>
				<TableRecentFiles />
			</motion.div>

			<motion.div variants={fadeInUp}>
				<SummaryCards />
			</motion.div>

			<motion.h3
				className="text-lg font-bold tracking-tight lg:text-xl cursor-pointer hover:text-primary"
				variants={fadeInUp}
			>
				<Link href="/drive">Recently added folders</Link>
			</motion.h3>

			<motion.div variants={fadeInUp}>
				<FolderListCards />
			</motion.div>
		</motion.div>
	);
}
