"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import React, { useCallback, useState } from "react";

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Folder name is required",
	}),
});

const CreateFolderDialog = ({ children }: { children?: React.ReactNode }) => {
	// Get the current folder ID from the URL params
	const params = useParams();
	const { path } = params;
	const folderId = path ? path[1] : null;
	const [open, setOpen] = useState(false);
	const form = useForm<z.infer<typeof formSchema>>({
		defaultValues: {
			name: "",
		},
		resolver: zodResolver(formSchema),
	});

	const { handleSubmit, control, reset } = form;
	const { mutate: createFolderMutate, isPending } = useMutation({
		mutationFn: async (values: z.infer<typeof formSchema>) => {
			const res = await fetch("/api/folders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...values,
					parent_id: folderId,
				}),
			});
			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.error || "Unknown error");
			}
			return result;
		},
		onSuccess: () => {
			reset();
			setOpen(false);
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) =>
		createFolderMutate(values);
	const CustomTrigger = useCallback(() => {
		const handleClick = (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setOpen(true);
		};

		if (children) {
			return (
				<div onClick={handleClick} className="cursor-pointer">
					{children}
				</div>
			);
		}

		return (
			<Button
				variant="outline"
				className="gap-2 transition-all duration-200 hover:bg-primary/10"
				onClick={handleClick}
			>
				Create Folder
			</Button>
		);
	}, [children, setOpen]);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<CustomTrigger />
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Folder</DialogTitle>
					<DialogDescription>
						{folderId
							? "Create a subfolder in the current folder"
							: "Create a new top-level folder"}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Folder name</FormLabel>
									<FormControl>
										<Input {...field} className="rounded-xl" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit" disabled={isPending}>
								{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Create
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default CreateFolderDialog;
