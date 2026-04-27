"use client";

import Link from "next/link";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PostPreview } from "@/components/social/PostPreview";
import { PrimaryButton, SecondaryButton, StatusPill } from "@/components/social/SocialUi";
import {
	briefLinkedinCopilot,
	CopilotAttachment,
	CopilotBriefResponse,
	CopilotSessionSnapshot,
	GeneratedLinkedinCalendar,
	GeneratedLinkedinCalendarPost,
	generateLinkedinCalendar,
	getCopilotSession,
	LinkedinCalendarDurationDays,
	listCopilotSessions,
} from "@/utils/api/socialClient";
import {
	IconArrowUp,
	IconBulb,
	IconCalendarEvent,
	IconChevronRight,
	IconHistory,
	IconLayoutSidebarRight,
	IconMessages,
	IconPhotoPlus,
	IconRotateClockwise,
	IconSparkles,
	IconX,
} from "@tabler/icons-react";

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
};

const starterPrompts = [
	"Create a 7-day LinkedIn plan for my founder brand",
	"Turn this launch into 15 days of LinkedIn posts",
	"Build a 30-day authority calendar with images and carousels",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const initialMessage: ChatMessage = {
	role: "assistant",
	content:
		"Tell me what you want to create for LinkedIn. I will use your saved memory, ask only for missing details, recommend a framework, and generate drafts after you approve the plan.",
};

export default function SocialCopilotPage() {
	const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
	const [prompt, setPrompt] = useState("");
	const [chatId, setChatId] = useState<string | null>(null);
	const [sessions, setSessions] = useState<CopilotSessionSnapshot[]>([]);
	const [loadingSessions, setLoadingSessions] = useState(true);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [attachments, setAttachments] = useState<CopilotAttachment[]>([]);
	const [brief, setBrief] = useState<CopilotBriefResponse | null>(null);
	const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [calendar, setCalendar] = useState<GeneratedLinkedinCalendar | null>(null);
	const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
	const [isThinking, setIsThinking] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const selectedFramework =
		brief?.recommendedFrameworks.find((item) => item.id === selectedFrameworkId) ||
		brief?.recommendedFrameworks[0] ||
		null;

	const selectedPost = useMemo(() => {
		if (!calendar?.posts.length) return null;
		return (
			calendar.posts.find((post) => post.postRunId === selectedPostId) ||
			calendar.posts[0]
		);
	}, [calendar, selectedPostId]);

	const groupedPosts = useMemo(() => {
		if (!calendar?.posts.length) return [];
		const groups = new Map<string, GeneratedLinkedinCalendarPost[]>();
		for (const post of calendar.posts) {
			groups.set(post.date, [...(groups.get(post.date) || []), post]);
		}
		return Array.from(groups.entries()).map(([date, posts]) => ({
			date,
			label: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
				weekday: "long",
				month: "short",
				day: "numeric",
			}),
			posts,
		}));
	}, [calendar]);

	const loadSessions = async () => {
		try {
			setLoadingSessions(true);
			setSessions(await listCopilotSessions());
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to load chats");
		} finally {
			setLoadingSessions(false);
		}
	};

	useEffect(() => {
		loadSessions();
	}, []);

	const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(event.target.files || []);
		if (!files.length) return;
		setAttachments((prev) => [
			...prev,
			...files.slice(0, 5).map((file) => ({
				name: file.name,
				type: file.type || "file",
				description: file.type.startsWith("image/")
					? "User-provided visual reference for LinkedIn creative direction"
					: "User-provided reference file",
			})),
		]);
		event.target.value = "";
	};

	const startNewChat = () => {
		setChatId(null);
		setMessages([initialMessage]);
		setAttachments([]);
		setBrief(null);
		setSelectedFrameworkId(null);
		setAnswers({});
		setCalendar(null);
		setSelectedPostId(null);
		setPrompt("");
		setDetailsOpen(false);
	};

	const resumeChat = async (id: string) => {
		try {
			const session = await getCopilotSession(id);
			setChatId(session.chatId);
			setMessages(
				session.messages.length
					? session.messages.map((message) => ({
							role: message.role,
							content: message.content,
						}))
					: [initialMessage]
			);
			setAttachments(session.attachments || []);
			setBrief(session.brief);
			setSelectedFrameworkId(session.selectedFrameworkId);
			setAnswers(session.answers || {});
			setCalendar(session.calendar);
			setSelectedPostId(session.calendar?.posts[0]?.postRunId ?? null);
			setHistoryOpen(false);
			if (session.brief || session.calendar) setDetailsOpen(true);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to resume chat");
		}
	};

	const askCopilot = async (text = prompt) => {
		const cleaned = text.trim();
		if (cleaned.length < 3) {
			toast.error("Tell the copilot what you want to create");
			return;
		}
		const userMessage: ChatMessage = { role: "user", content: cleaned };
		const nextMessages = [...messages, userMessage];
		try {
			setPrompt("");
			setIsThinking(true);
			setMessages(nextMessages);
			setCalendar(null);
			const response = await briefLinkedinCopilot({
				chatId: chatId || undefined,
				prompt: cleaned,
				conversation: messages.slice(-8),
				attachments,
			});
			const resolvedChatId = response.chatId || response.session?.chatId || chatId;
			if (resolvedChatId) setChatId(resolvedChatId);
			setBrief(response);
			setSelectedFrameworkId(
				response.session?.selectedFrameworkId ||
					response.recommendedFrameworks[0]?.id ||
					null
			);
			setMessages([
				...nextMessages,
				{ role: "assistant", content: response.reply },
			]);
			setDetailsOpen(true);
			await loadSessions();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Copilot failed to respond");
		} finally {
			setIsThinking(false);
		}
	};

	const generateApprovedPlan = async () => {
		if (!brief || !selectedFramework) {
			toast.error("Ask the copilot for a plan first");
			return;
		}
		try {
			setIsGenerating(true);
			const questionAnswers = Object.fromEntries(
				Object.entries(answers).filter(([, value]) => value.trim())
			);
			const generationDoneMessage = `Done. I created the approved ${selectedFramework.label} plan and saved the drafts into your pipeline.`;
			const result = await generateLinkedinCalendar({
				chatId: chatId || undefined,
				durationDays:
					selectedFramework.durationDays ||
					brief.intent.durationDays ||
					(7 as LinkedinCalendarDurationDays),
				startDate: todayIso(),
				postsPerWeek: selectedFramework.postsPerWeek || brief.intent.postsPerWeek,
				focus: selectedFramework.focus || brief.intent.focus,
				approvalBehavior: "draft",
				userPrompt: messages.filter((msg) => msg.role === "user").at(-1)?.content,
				selectedFramework: selectedFramework.label,
				answers: questionAnswers,
				approvedArchitecture: brief.architecture as unknown as Record<string, unknown>,
				attachments,
				mediaMode: selectedFramework.mediaMode || brief.intent.mediaMode || "auto",
				imageStyle: "professional",
				aspectRatio: "1:1",
				messages: [...messages, { role: "assistant", content: generationDoneMessage }],
				selectedFrameworkId: selectedFramework.id,
				briefSnapshot: brief,
			});
			setCalendar(result);
			setSelectedPostId(result.posts[0]?.postRunId ?? null);
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `Done. I created ${result.totalPosts} LinkedIn draft(s), saved them into your draft pipeline, and attached media tasks where the plan called for images or carousels.`,
				},
			]);
			setDetailsOpen(true);
			toast.success(`Generated ${result.totalPosts} LinkedIn draft(s)`);
			await loadSessions();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate the approved plan"
			);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-3 py-3 md:px-4">
			<div className="mx-auto flex h-[calc(100vh-24px)] max-w-[1500px] flex-col gap-3">
				<header className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
								LinkedIn Copilot
							</p>
							<h1 className="mt-0.5 text-sm font-semibold tracking-[-0.03em] text-slate-950 md:text-2xl">
								Chat with your LinkedIn content strategist
							</h1>
							<p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500">
								A focused chat canvas with strategy, history, and draft previews kept in drawers and compact panels.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<SecondaryButton onClick={() => setHistoryOpen(true)} className="text-xs p-2">
								<IconHistory className="h-3 w-3" />
								History
							</SecondaryButton>
							<SecondaryButton onClick={() => setDetailsOpen(true)} className="text-xs p-2">
								<IconLayoutSidebarRight className="h-3 w-3" />
								Workspace
							</SecondaryButton>
							<SecondaryButton onClick={startNewChat} className="text-xs p-2">New chat</SecondaryButton>
							<Link href="/social/memory">
								<SecondaryButton className="text-xs p-2">
									<IconBulb className="h-3 w-3" />
									Tune memory
								</SecondaryButton>
							</Link>
						</div>
					</div>
				</header>

				<main className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_390px]">
					<section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.09)]">
						<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
									<IconMessages className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-slate-900">
										{chatId ? `Resume-safe chat ${chatId.slice(0, 8)}` : "New strategy chat"}
									</p>
									<p className="text-[11px] text-slate-500">
										Memory-aware planning · Framework selection · Draft generation
									</p>
								</div>
							</div>
							<div className="hidden items-center gap-2 md:flex">
								<StatusPill label={`${sessions.length} saved`} tone="info" />
								{calendar && <StatusPill label={`${calendar.totalPosts} drafts`} tone="positive" />}
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4">
							<div className="mx-auto flex max-w-4xl flex-col gap-3">
								{messages.map((message, index) => (
									<ChatBubble key={`${message.role}-${index}`} message={message} />
								))}
								{isThinking && (
									<div className="mr-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-sm">
										<IconRotateClockwise className="h-3.5 w-3.5 animate-spin" />
										Thinking through the best content flow...
									</div>
								)}
							</div>
						</div>

						<div className="border-t border-slate-100 bg-white px-4 py-3">
							<div className="mx-auto max-w-4xl space-y-2">
								{attachments.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{attachments.map((file, index) => (
											<span
												key={`${file.name}-${index}`}
												className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
											>
												{file.name}
											</span>
										))}
									</div>
								)}
								<div className="flex overflow-x-auto no-scrollbar whitespace-nowrap gap-1.5">
									{starterPrompts.map((item) => (
										<button
											key={item}
											type="button"
											onClick={() => askCopilot(item)}
											className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
										>
											{item}
										</button>
									))}
								</div>
								<div className="rounded-[20px] border border-slate-200 bg-white p-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.07)]">
									<textarea
										value={prompt}
										onChange={(event) => setPrompt(event.target.value)}
										placeholder="Example: I want a 7-day LinkedIn plan for launching my AI ad reporting feature. Use my founder tone, include images, and make it beginner-friendly."
										rows={2}
										className="max-h-40 min-h-[46px] w-full resize-y border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
									/>
									<div className="flex items-center justify-between border-t border-slate-100 px-2 pt-1.5">
										<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
											<IconPhotoPlus className="h-4 w-4" />
											Add context
											<input
												type="file"
												multiple
												className="hidden"
												onChange={handleFiles}
											/>
										</label>
										<PrimaryButton onClick={() => askCopilot()} disabled={isThinking}>
											{isThinking ? (
												<IconRotateClockwise className="h-4 w-4 animate-spin" />
											) : (
												<IconArrowUp className="h-4 w-4" />
											)}
											Send
										</PrimaryButton>
									</div>
								</div>
							</div>
						</div>
					</section>

					<aside className="hidden min-h-0 xl:block">
						<WorkspacePanel
							brief={brief}
							calendar={calendar}
							selectedFrameworkId={selectedFramework?.id || null}
							onSelectFramework={setSelectedFrameworkId}
							answers={answers}
							onAnswer={(key, value) =>
								setAnswers((prev) => ({ ...prev, [key]: value }))
							}
							groupedPosts={groupedPosts}
							selectedPost={selectedPost}
							onSelectPost={setSelectedPostId}
							onGenerate={generateApprovedPlan}
							isGenerating={isGenerating}
						/>
					</aside>
				</main>
			</div>

			<HistoryDrawer
				open={historyOpen}
				onClose={() => setHistoryOpen(false)}
				sessions={sessions}
				loading={loadingSessions}
				activeChatId={chatId}
				onRefresh={loadSessions}
				onResume={resumeChat}
				onNew={startNewChat}
			/>

			<DetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)}>
				<WorkspacePanel
					brief={brief}
					calendar={calendar}
					selectedFrameworkId={selectedFramework?.id || null}
					onSelectFramework={setSelectedFrameworkId}
					answers={answers}
					onAnswer={(key, value) =>
						setAnswers((prev) => ({ ...prev, [key]: value }))
					}
					groupedPosts={groupedPosts}
					selectedPost={selectedPost}
					onSelectPost={setSelectedPostId}
					onGenerate={generateApprovedPlan}
					isGenerating={isGenerating}
				/>
			</DetailsDrawer>
		</div>
	);
}

function ChatBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[82%] rounded-[20px] px-4 py-2.5 text-sm leading-6 shadow-sm ${
					isUser
						? "bg-blue-600 text-white shadow-blue-600/20"
						: "border border-slate-200 bg-white text-slate-700"
				}`}
			>
				{message.content}
			</div>
		</div>
	);
}

function WorkspacePanel({
	brief,
	calendar,
	selectedFrameworkId,
	onSelectFramework,
	answers,
	onAnswer,
	groupedPosts,
	selectedPost,
	onSelectPost,
	onGenerate,
	isGenerating,
}: {
	brief: CopilotBriefResponse | null;
	calendar: GeneratedLinkedinCalendar | null;
	selectedFrameworkId: string | null;
	onSelectFramework: (id: string) => void;
	answers: Record<string, string>;
	onAnswer: (key: string, value: string) => void;
	groupedPosts: Array<{ date: string; label: string; posts: GeneratedLinkedinCalendarPost[] }>;
	selectedPost: GeneratedLinkedinCalendarPost | null;
	onSelectPost: (id: number) => void;
	onGenerate: () => void;
	isGenerating: boolean;
}) {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.09)]">
			<div className="border-b border-slate-100 px-4 py-3">
				<p className="text-sm font-semibold text-slate-950">Workspace</p>
				<p className="text-xs text-slate-500">Strategy, questions, drafts, and preview.</p>
			</div>
			<div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
				{brief ? (
					<BriefingPanel
						brief={brief}
						selectedFrameworkId={selectedFrameworkId}
						onSelectFramework={onSelectFramework}
						answers={answers}
						onAnswer={onAnswer}
						onGenerate={onGenerate}
						isGenerating={isGenerating}
					/>
				) : (
					<PromptActionCard />
				)}
				{calendar && (
					<DraftsPanel
						calendar={calendar}
						groupedPosts={groupedPosts}
						selectedPost={selectedPost}
						onSelectPost={onSelectPost}
					/>
				)}
			</div>
		</div>
	);
}

function PromptActionCard() {
	return (
		<div className="rounded-[20px] border border-dashed border-blue-200 bg-white p-4 text-center">
			<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
				<IconSparkles className="h-5 w-5" />
			</div>
			<h3 className="mt-3 text-sm font-semibold text-slate-900">Start with a prompt</h3>
			<p className="mt-1.5 text-xs leading-5 text-slate-500">
				The copilot will recommend a 7-day, 15-day, or 30-day framework and open the plan here for approval.
			</p>
		</div>
	);
}

function BriefingPanel({
	brief,
	selectedFrameworkId,
	onSelectFramework,
	answers,
	onAnswer,
	onGenerate,
	isGenerating,
}: {
	brief: CopilotBriefResponse;
	selectedFrameworkId: string | null;
	onSelectFramework: (id: string) => void;
	answers: Record<string, string>;
	onAnswer: (key: string, value: string) => void;
	onGenerate: () => void;
	isGenerating: boolean;
}) {
	const [fullPlanOpen, setFullPlanOpen] = useState(false);

	return (
		<div className="space-y-3">
			<div className="rounded-[20px] border border-slate-200 bg-white p-3">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold text-slate-950">
							{brief.architecture.title}
						</p>
						<p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
							{brief.architecture.summary}
						</p>
					</div>
					<StatusPill label={`${brief.memoryUsed.profileKeyCount} memory`} tone="info" />
				</div>
			</div>

			<div className="rounded-[20px] border border-slate-200 bg-white p-3">
				<p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
					Frameworks
				</p>
				<div className="mt-2 space-y-2">
					{brief.recommendedFrameworks.slice(0, 2).map((framework) => (
						<button
							key={framework.id}
							type="button"
							onClick={() => onSelectFramework(framework.id)}
							className={`w-full rounded-2xl border p-2.5 text-left transition ${
								selectedFrameworkId === framework.id
									? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
									: "border-slate-200 bg-white hover:border-blue-200"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-sm font-semibold text-slate-900">{framework.label}</p>
									<p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{framework.reason}</p>
								</div>
								<IconChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
							</div>
							<div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
								<span>{framework.durationDays} days</span>
								<span>{framework.postsPerWeek}/week</span>
								<span>{framework.mediaMode}</span>
							</div>
						</button>
					))}
				</div>
			</div>

			{brief.questions.length > 0 && (
				<div className="rounded-[20px] border border-slate-200 bg-white p-3">
					<p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
						Missing details
					</p>
					<div className="mt-2 space-y-2">
						{brief.questions.slice(0, 2).map((question, index) => (
							<label key={question} className="block">
								<span className="text-xs font-semibold text-slate-700">{question}</span>
								<input
									value={answers[String(index)] || ""}
									onChange={(event) => onAnswer(String(index), event.target.value)}
									placeholder="Leave blank to use memory"
									className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
								/>
							</label>
						))}
					</div>
				</div>
			)}

			<div className="rounded-[24px] border border-slate-200 bg-white p-4">
				<p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
					Plan architecture
				</p>
				<div className="mt-3 space-y-2">
					{brief.architecture.days.slice(0, 4).map((day) => (
						<div key={`${day.day}-${day.theme}`} className="rounded-2xl bg-slate-50 p-3">
							<div className="flex items-start justify-between gap-3">
								<p className="text-sm font-semibold text-slate-800">
									Day {day.day}: {day.theme}
								</p>
								<StatusPill label={day.kltStage} tone="info" />
							</div>
							<p className="mt-1 text-xs leading-5 text-slate-500">
								{day.framework} · {day.creativeDirection} · {day.mediaSuggestion}
							</p>
						</div>
					))}
					{brief.architecture.days.length > 4 && (
						<button
							type="button"
							onClick={() => setFullPlanOpen(true)}
							className="text-xs font-semibold text-blue-600 hover:text-blue-700"
						>
							View all {brief.architecture.days.length} planned days
						</button>
					)}
				</div>
			</div>

			<PrimaryButton onClick={onGenerate} disabled={isGenerating} className="w-full">
				{isGenerating ? (
					<>
						<IconRotateClockwise className="h-4 w-4 animate-spin" />
						Generating posts...
					</>
				) : (
					<>
						<IconSparkles className="h-4 w-4" />
						Approve and generate
					</>
				)}
			</PrimaryButton>

			<PlanArchitectureModal
				open={fullPlanOpen}
				onClose={() => setFullPlanOpen(false)}
				brief={brief}
			/>
		</div>
	);
}

function PlanArchitectureModal({
	open,
	onClose,
	brief,
}: {
	open: boolean;
	onClose: () => void;
	brief: CopilotBriefResponse;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-[60]">
			<div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} />
			<div className="absolute left-1/2 top-1/2 max-h-[82vh] w-[calc(100%-32px)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] bg-white shadow-2xl">
				<div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
					<div>
						<p className="text-sm font-semibold text-slate-950">{brief.architecture.title}</p>
						<p className="mt-1 text-xs leading-5 text-slate-500">{brief.architecture.summary}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
					>
						<IconX className="h-5 w-5" />
					</button>
				</div>
				<div className="max-h-[64vh] space-y-2 overflow-y-auto bg-slate-50 p-4">
					{brief.architecture.days.map((day) => (
						<div key={`${day.day}-${day.theme}`} className="rounded-2xl border border-slate-200 bg-white p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-semibold text-slate-900">
									Day {day.day}: {day.theme}
								</p>
								<StatusPill label={day.kltStage} tone="info" />
							</div>
							<p className="mt-1 text-xs leading-5 text-slate-500">
								{day.framework} · {day.creativeDirection} · {day.mediaSuggestion}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function DraftsPanel({
	calendar,
	groupedPosts,
	selectedPost,
	onSelectPost,
}: {
	calendar: GeneratedLinkedinCalendar;
	groupedPosts: Array<{ date: string; label: string; posts: GeneratedLinkedinCalendarPost[] }>;
	selectedPost: GeneratedLinkedinCalendarPost | null;
	onSelectPost: (id: number) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="rounded-[24px] border border-slate-200 bg-white p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-semibold text-slate-950">Generated drafts</p>
						<p className="text-xs text-slate-500">{calendar.totalPosts} drafts in the pipeline</p>
					</div>
					<IconCalendarEvent className="h-5 w-5 text-blue-500" />
				</div>
				<div className="mt-4 space-y-4">
					{groupedPosts.map((group) => (
						<div key={group.date}>
							<p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
								{group.label}
							</p>
							<div className="space-y-2">
								{group.posts.map((post) => (
									<button
										key={post.postRunId}
										type="button"
										onClick={() => onSelectPost(post.postRunId)}
										className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
											selectedPost?.postRunId === post.postRunId
												? "border-blue-400 bg-blue-50"
												: "border-slate-200 bg-white hover:border-blue-200"
										}`}
									>
										<p className="line-clamp-2 text-sm font-semibold text-slate-800">
											{post.hook || post.topic}
										</p>
										<div className="mt-2 flex flex-wrap gap-2">
											<StatusPill status={post.status} label={post.kltStage} />
											<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
												{post.mediaAssets?.length ? `${post.mediaAssets.length} media` : post.format}
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			{selectedPost && <SelectedPostPreview post={selectedPost} />}
		</div>
	);
}

function SelectedPostPreview({ post }: { post: GeneratedLinkedinCalendarPost }) {
	return (
		<div className="rounded-[24px] border border-slate-200 bg-white p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-semibold text-slate-950">{post.topic}</p>
					<p className="mt-1 text-xs leading-5 text-slate-500">{post.angle}</p>
				</div>
				<StatusPill status={post.status} />
			</div>
			<div className="mt-4">
				<PostPreview body={post.postBody} hashtags={post.hashtags} />
			</div>
			<div className="mt-4 flex flex-wrap gap-2">
				<Link href={`/social/posts/${post.postRunId}`}>
					<PrimaryButton>Open draft</PrimaryButton>
				</Link>
				<Link href="/social/approval-queue">
					<SecondaryButton>Review queue</SecondaryButton>
				</Link>
			</div>
		</div>
	);
}

function HistoryDrawer({
	open,
	onClose,
	sessions,
	loading,
	activeChatId,
	onRefresh,
	onResume,
	onNew,
}: {
	open: boolean;
	onClose: () => void;
	sessions: CopilotSessionSnapshot[];
	loading: boolean;
	activeChatId: string | null;
	onRefresh: () => void;
	onResume: (id: string) => void;
	onNew: () => void;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} />
			<aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
					<div>
						<p className="text-sm font-semibold text-slate-950">Copilot history</p>
						<p className="text-xs text-slate-500">Resume old chats or start fresh.</p>
					</div>
					<button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
						<IconX className="h-5 w-5" />
					</button>
				</div>
				<div className="flex gap-2 border-b border-slate-100 px-5 py-3">
					<PrimaryButton onClick={onNew}>New chat</PrimaryButton>
					<SecondaryButton onClick={onRefresh}>{loading ? "Loading..." : "Refresh"}</SecondaryButton>
				</div>
				<div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
					{sessions.length === 0 ? (
						<p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
							No saved chats yet. Your next Copilot prompt will appear here.
						</p>
					) : (
						sessions.map((session) => (
							<button
								key={session.chatId}
								onClick={() => onResume(session.chatId)}
								className={`w-full rounded-2xl border p-4 text-left transition ${
									activeChatId === session.chatId
										? "border-blue-400 bg-blue-50"
										: "border-slate-200 bg-white hover:border-blue-200"
								}`}
							>
								<p className="line-clamp-2 text-sm font-semibold text-slate-900">{session.title}</p>
								<p className="mt-2 text-xs text-slate-500">
									{session.status} · {new Date(session.updatedAt).toLocaleString()}
								</p>
							</button>
						))
					)}
				</div>
			</aside>
		</div>
	);
}

function DetailsDrawer({
	open,
	onClose,
	children,
}: {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-40 xl:hidden">
			<div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={onClose} />
			<aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden bg-white shadow-2xl">
				<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
					<div>
						<p className="text-sm font-semibold text-slate-950">Workspace</p>
						<p className="text-xs text-slate-500">Plan, questions, drafts, preview.</p>
					</div>
					<button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
						<IconX className="h-5 w-5" />
					</button>
				</div>
				<div className="h-[calc(100%-73px)] overflow-y-auto bg-slate-50 p-4">
					{children}
				</div>
			</aside>
		</div>
	);
}
