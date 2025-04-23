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

const formSchema = z.object({
	name: z.string().min(2, {
		message: "Folder name is required",
	}),
});

const CreateFolderDialog = () => {
	// Get the current folder ID from the URL params
	const params = useParams();
	const { folderId } = params;
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
					parent_id: folderId ?? null, // Include the parent_id from URL params
				}),
			});
			const result = await res.json();
			if (!res.ok) {
				throw new Error(result.error || "Unknown error");
			}
			return result;
		},
		onSuccess: (data, variables, context) => {
			reset();
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) =>
		createFolderMutate(values);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Create</Button>
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
