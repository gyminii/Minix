"use client";
import { FileUploadForm } from "@/components/upload-form";

import {
	FolderListCards,
	StorageStatusCard,
	SummaryCards,
	TableRecentFiles,
} from "../components";
import { motion } from "framer-motion";

// Animation variants for container
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.3,
		},
	},
};

// Animation variants for individual items
const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 260,
			damping: 20,
		},
	},
};

// Animation variants for title
const titleVariants = {
	hidden: { opacity: 0, y: -20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 300,
			damping: 30,
			delay: 0.2,
		},
	},
};

const Client = () => {
	return (
		<motion.div
			className="space-y-4"
			variants={containerVariants}
			initial="hidden"
			animate="show"
		>
			<motion.div
				className="flex flex-row items-center justify-between"
				variants={titleVariants}
			>
				<h1 className="text-xl font-bold tracking-tight lg:text-2xl">
					File Manager
				</h1>
			</motion.div>

			<motion.div variants={itemVariants}>
				<FileUploadForm />
			</motion.div>

			<motion.div variants={itemVariants}>
				<SummaryCards />
			</motion.div>

			<motion.h3
				className="text-lg font-bold tracking-tight lg:text-xl"
				variants={itemVariants}
			>
				Recently added folders
			</motion.h3>

			<motion.div
				className="mb-4 grid gap-4 lg:grid-cols-3"
				variants={itemVariants}
			>
				<div className="lg:col-span-2">
					<FolderListCards />
				</div>
				<StorageStatusCard />
			</motion.div>

			<motion.div
				className="gap-4 space-y-4 lg:grid lg:grid-cols-2 lg:space-y-0"
				variants={itemVariants}
			>
				<TableRecentFiles />
			</motion.div>
		</motion.div>
	);
};

export default Client;
