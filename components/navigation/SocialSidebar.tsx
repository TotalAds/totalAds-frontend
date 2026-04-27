"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/utils/cn";
import {
	IconActivity,
	IconBrain,
	IconBrandLinkedin,
	IconBrandTelegram,
	IconCalendarEvent,
	IconCircleCheck,
	IconInbox,
	IconLayoutDashboard,
	IconLogout,
	IconPencilPlus,
	IconSettings,
	IconSparkles,
	IconStack2,
	IconX,
} from "@tabler/icons-react";

import GetLogo from "../common/getLogo";

interface SocialSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

type NavItem = {
	name: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	hint?: string;
};

const buildSections = (): Array<{ label: string; items: NavItem[] }> => [
	{
		label: "Agent",
		items: [
			{
				name: "Dashboard",
				href: "/social/dashboard",
				icon: IconLayoutDashboard,
			},
			{
				name: "Post Studio",
				href: "/social/post-studio",
				icon: IconPencilPlus,
			},
			{
				name: "Copilot",
				href: "/social/copilot",
				icon: IconSparkles,
			},
			{
				name: "Approvals",
				href: "/social/approval-queue",
				icon: IconInbox,
			},
			{
				name: "Calendar",
				href: "/social/calendar",
				icon: IconCalendarEvent,
			},
		],
	},
	{
		label: "Content",
		items: [
			{ name: "Posts", href: "/social/posts", icon: IconStack2 },
			{
				name: "Learning Rules",
				href: "/social/learning-rules",
				icon: IconSparkles,
			},
			{ name: "Memory", href: "/social/memory", icon: IconBrain },
			{
				name: "Event Log",
				href: "/social/events",
				icon: IconActivity,
			},
		],
	},
	{
		label: "Connections",
		items: [
			{
				name: "LinkedIn",
				href: "/social/linkedin",
				icon: IconBrandLinkedin,
			},
			{
				name: "Telegram",
				href: "/social/telegram",
				icon: IconBrandTelegram,
			},
			{ name: "Settings", href: "/social/settings", icon: IconSettings },
		],
	},
];

const isActivePath = (pathname: string | null, href: string) => {
	if (!pathname) return false;
	if (href === "/social/dashboard") {
		return pathname === href || pathname === "/social";
	}
	return pathname === href || pathname.startsWith(href + "/");
};

const SocialSidebar: React.FC<SocialSidebarProps> = ({ isOpen, onClose }) => {
	const pathname = usePathname();
	const router = useRouter();
	const { state, logoutUser } = useAuthContext();
	const sections = buildSections();

	const handleLogout = async () => {
		await logoutUser();
		router.push("/login");
	};

	return (
		<>
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
					onClick={onClose}
				/>
			)}

			<div
				className={cn(
					"fixed left-0 top-0 z-40 flex h-screen w-64 flex-shrink-0 flex-col bg-sidebar shadow-xl transition-all duration-300 ease-in-out md:relative",
					isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				)}
			>
				<div className="border-b border-sidebar-border px-4 py-5">
					<div className="flex items-center justify-between">
						<Link
							href="/social/dashboard"
							className="flex items-center space-x-3"
						>
							<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
								<GetLogo className="h-8 w-8" color="#3b82f6" />
							</div>
							<div className="overflow-hidden">
								<h1 className="whitespace-nowrap text-base font-bold text-sidebar-text">
									SocialSniper
								</h1>
								<p className="whitespace-nowrap text-xs text-sidebar-muted">
									LinkedIn ghost-writer agent
								</p>
							</div>
						</Link>
						<button
							onClick={onClose}
							className="absolute right-4 top-4 rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text md:hidden"
						>
							<IconX className="h-5 w-5" />
						</button>
					</div>
				</div>

				<nav className="sidebar-scrollbar no-scrollbar flex-1 overflow-y-auto px-3 py-4">
					{sections.map((section) => (
						<div key={section.label} className="mb-5 last:mb-0">
							<h3 className="mb-2 whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
								{section.label}
							</h3>
							<div className="space-y-1">
								{section.items.map((item) => {
									const Icon = item.icon;
									const isActive = isActivePath(pathname, item.href);
									return (
										<Link
											key={item.name}
											href={item.href}
											onClick={() => {
												if (window.innerWidth < 768) onClose();
											}}
											className={cn(
												"flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
												isActive
													? "bg-brand-main text-white shadow-md"
													: "text-sidebar-text hover:bg-sidebar-hover"
											)}
										>
											<Icon className="mr-3 h-5 w-5" />
											<span>{item.name}</span>
										</Link>
									);
								})}
							</div>
						</div>
					))}

					{state.user?.socialLinkedinConnected && (
						<div className="mt-3 rounded-xl border border-sidebar-border bg-sidebar-hover/50 px-3 py-3 text-xs text-sidebar-text">
							<div className="flex items-center gap-2">
								<IconCircleCheck className="h-4 w-4 text-emerald-400" />
								<span className="font-semibold">LinkedIn connected</span>
							</div>
							<a
								href={
									state.user.socialLinkedinExternalUrl ||
									"https://www.linkedin.com/feed/"
								}
								target="_blank"
								rel="noreferrer"
								className="mt-2 inline-block text-[11px] text-blue-300 hover:text-blue-200"
							>
								Open LinkedIn profile →
							</a>
						</div>
					)}
				</nav>

				<div className="mt-auto border-t border-sidebar-border px-3 py-4">
					<button
						onClick={handleLogout}
						className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-sidebar-text transition-colors hover:bg-red-500/10 hover:text-red-400"
					>
						<IconLogout className="mr-3 h-4 w-4" />
						Sign out
					</button>
				</div>
			</div>
		</>
	);
};

export default SocialSidebar;
