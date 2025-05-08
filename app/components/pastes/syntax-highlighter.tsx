import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeHighlighterProps = {
	content: string;
	language: string;
};

export function CodeHighlighter({ content, language }: CodeHighlighterProps) {
	return (
		<div className="w-full max-w-full overflow-hidden">
			<SyntaxHighlighter
				language={language === "plaintext" ? "text" : language}
				style={vscDarkPlus}
				showLineNumbers
				wrapLines={true}
				wrapLongLines={true}
				customStyle={{
					margin: 0,
					padding: "1rem",
					fontSize: "0.875rem",
					borderRadius: "0",
					maxHeight: "500px",
					width: "100%",
					maxWidth: "100%",
					overflow: "hidden",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					wordWrap: "break-word",
				}}
				codeTagProps={{
					style: {
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
						wordWrap: "break-word",
						maxWidth: "100%",
						display: "inline-block",
					},
				}}
				PreTag={({ children, ...props }) => (
					<pre
						{...props}
						style={{
							...props.style,
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
							wordWrap: "break-word",
							maxWidth: "100%",
							overflowX: "hidden",
						}}
					>
						{children}
					</pre>
				)}
				CodeTag={({ children, ...props }) => (
					<code
						{...props}
						style={{
							...props.style,
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
							wordWrap: "break-word",
							maxWidth: "100%",
						}}
					>
						{children}
					</code>
				)}
			>
				{content}
			</SyntaxHighlighter>
		</div>
	);
}
