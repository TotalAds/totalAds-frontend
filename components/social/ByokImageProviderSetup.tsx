"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IconCheck, IconKey, IconPhoto, IconPlug } from "@tabler/icons-react";

import {
	InlineAlert,
	PrimaryButton,
	SecondaryButton,
	StatusPill,
} from "@/components/social/SocialUi";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	deleteSocialImageProvider,
	discoverSocialImageModels,
	DiscoveredImageModel,
	listSocialImageProviders,
	saveSocialImageProvider,
	SocialImageProviderRow,
	SocialImageProviderType,
} from "@/utils/api/socialClient";

const PROVIDER_OPTIONS: Array<{
	id: SocialImageProviderType;
	label: string;
	description: string;
}> = [
	{
		id: "openai",
		label: "OpenAI",
		description: "GPT Image 1, DALL·E 3, and DALL·E 2",
	},
	{
		id: "gemini",
		label: "Google Gemini",
		description: "Gemini image models via Google AI",
	},
	{
		id: "openrouter",
		label: "OpenRouter",
		description: "Image-capable models from multiple vendors",
	},
];

const providerLabel = (provider: SocialImageProviderType) =>
	PROVIDER_OPTIONS.find((row) => row.id === provider)?.label || provider;

export function ByokImageProviderSetup({
	platformImages,
	byokImages,
}: {
	platformImages?: number;
	byokImages?: number;
}) {
	const [imageProviders, setImageProviders] = useState<SocialImageProviderRow[]>([]);
	const [loadingProviders, setLoadingProviders] = useState(true);

	const [provider, setProvider] = useState<SocialImageProviderType>("openai");
	const [apiKey, setApiKey] = useState("");
	const [models, setModels] = useState<DiscoveredImageModel[]>([]);
	const [selectedModel, setSelectedModel] = useState("");
	const [validationMessage, setValidationMessage] = useState<string | null>(null);
	const [validating, setValidating] = useState(false);
	const [saving, setSaving] = useState(false);

	const activeProvider = useMemo(
		() => imageProviders.find((row) => row.isDefault && row.isValid) || null,
		[imageProviders]
	);

	const refreshProviders = async () => {
		const providers = await listSocialImageProviders();
		setImageProviders(providers);
		return providers;
	};

	useEffect(() => {
		refreshProviders()
			.catch(() => setImageProviders([]))
			.finally(() => setLoadingProviders(false));
	}, []);

	const resetDiscovery = () => {
		setModels([]);
		setSelectedModel("");
		setValidationMessage(null);
	};

	const handleProviderChange = (next: SocialImageProviderType) => {
		setProvider(next);
		setApiKey("");
		resetDiscovery();
	};

	const validateAndLoadModels = async () => {
		if (!apiKey.trim()) {
			toast.error("Enter your API key first");
			return;
		}

		setValidating(true);
		setValidationMessage(null);
		resetDiscovery();

		try {
			const result = await discoverSocialImageModels({
				provider,
				apiKey: apiKey.trim(),
			});

			if (!result.valid || !result.models.length) {
				setValidationMessage(
					result.message || "Could not validate this API key or find image models."
				);
				toast.error(result.message || "API key validation failed");
				return;
			}

			setModels(result.models);
			setSelectedModel(result.models[0]?.id || "");
			setValidationMessage(
				result.message ||
					`Validated. Found ${result.models.length} image model${result.models.length === 1 ? "" : "s"}.`
			);
			toast.success("API key validated");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to validate API key";
			setValidationMessage(message);
			toast.error(message);
		} finally {
			setValidating(false);
		}
	};

	const saveProvider = async () => {
		if (!apiKey.trim()) {
			toast.error("Enter your API key first");
			return;
		}
		if (!selectedModel) {
			toast.error("Select an image model");
			return;
		}

		setSaving(true);
		try {
			const response = await saveSocialImageProvider({
				provider,
				apiKey: apiKey.trim(),
				model: selectedModel,
				isDefault: true,
			});
			toast.success(response?.message || "Image provider saved");
			setApiKey("");
			resetDiscovery();
			await refreshProviders();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save provider");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			{typeof platformImages === "number" && typeof byokImages === "number" && (
				<p className="text-sm text-slate-600">
					This month: {platformImages} platform images · {byokImages} BYOK images
					(unlimited)
				</p>
			)}

			{activeProvider && (
				<InlineAlert
					tone="success"
					title="Your API key is active"
					description={`Image generation uses ${providerLabel(activeProvider.provider)}${activeProvider.model ? ` · ${activeProvider.model}` : ""}. Platform keys are not used while this configuration is valid.`}
					action={<StatusPill tone="positive" label="BYOK active" />}
				/>
			)}

			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900">
					<IconPlug className="h-4 w-4 text-blue-600" />
					Connect your image provider
				</div>

				<ol className="space-y-5">
					<li className="space-y-3">
						<div className="flex items-center gap-2 text-sm font-medium text-slate-800">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
								1
							</span>
							Choose provider
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							{PROVIDER_OPTIONS.map((option) => {
								const selected = provider === option.id;
								return (
									<button
										key={option.id}
										type="button"
										onClick={() => handleProviderChange(option.id)}
										className={[
											"rounded-xl border p-4 text-left transition",
											selected
												? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-100"
												: "border-slate-200 bg-slate-50 hover:border-slate-300",
										].join(" ")}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="font-medium text-slate-900">{option.label}</p>
											{selected && <IconCheck className="h-4 w-4 text-blue-600" />}
										</div>
										<p className="mt-1 text-xs text-slate-500">{option.description}</p>
									</button>
								);
							})}
						</div>
					</li>

					<li className="space-y-3">
						<div className="flex items-center gap-2 text-sm font-medium text-slate-800">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
								2
							</span>
							Add and validate API key
						</div>
						<div className="grid gap-3 md:grid-cols-[1fr_auto]">
							<div className="space-y-2">
								<label className="text-xs font-medium uppercase tracking-wide text-slate-500">
									API key
								</label>
								<div className="relative">
									<IconKey className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
									<Input
										type="password"
										placeholder={`Paste your ${providerLabel(provider)} API key`}
										value={apiKey}
										onChange={(e) => {
											setApiKey(e.target.value);
											resetDiscovery();
										}}
										className="pl-9"
									/>
								</div>
							</div>
							<div className="flex items-end">
								<SecondaryButton
									disabled={validating || !apiKey.trim()}
									onClick={validateAndLoadModels}
								>
									{validating ? "Validating..." : "Validate key"}
								</SecondaryButton>
							</div>
						</div>
						{validationMessage && (
							<p
								className={[
									"text-sm",
									models.length ? "text-emerald-700" : "text-rose-700",
								].join(" ")}
							>
								{validationMessage}
							</p>
						)}
					</li>

					{models.length > 0 && (
						<li className="space-y-3">
							<div className="flex items-center gap-2 text-sm font-medium text-slate-800">
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
									3
								</span>
								Select image model
							</div>
							<div className="space-y-2">
								<label className="text-xs font-medium uppercase tracking-wide text-slate-500">
									Image generation model
								</label>
								<Select value={selectedModel} onValueChange={setSelectedModel}>
									<SelectTrigger>
										<SelectValue placeholder="Choose a model" />
									</SelectTrigger>
									<SelectContent>
										{models.map((model) => (
											<SelectItem key={model.id} value={model.id}>
												{model.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{selectedModel && (
									<p className="text-xs text-slate-500">
										{models.find((row) => row.id === selectedModel)?.description ||
											`Model ID: ${selectedModel}`}
									</p>
								)}
							</div>
							<div className="flex justify-end">
								<PrimaryButton
									disabled={saving || !selectedModel}
									onClick={saveProvider}
								>
									{saving ? "Saving..." : "Save and use my key"}
								</PrimaryButton>
							</div>
						</li>
					)}
				</ol>
			</div>

			<div className="space-y-3">
				<div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
					<IconPhoto className="h-4 w-4 text-slate-500" />
					Saved providers
				</div>
				{loadingProviders ? (
					<p className="text-sm text-slate-500">Loading providers...</p>
				) : imageProviders.length === 0 ? (
					<p className="text-sm text-slate-500">
						No provider connected yet. Complete the steps above to start using your own
						API key.
					</p>
				) : (
					<ul className="space-y-2">
						{imageProviders.map((row) => (
							<li
								key={row.id}
								className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
							>
								<div>
									<p className="font-medium text-slate-900">
										{providerLabel(row.provider)}
										{row.isDefault ? " · default" : ""}
									</p>
									<p className="mt-1 text-slate-600">
										{row.model || "No model selected"} ·{" "}
										{row.isValid ? "Validated" : "Invalid"}
									</p>
								</div>
								<SecondaryButton
									onClick={async () => {
										await deleteSocialImageProvider(row.id);
										toast.success("Provider removed");
										await refreshProviders();
									}}
								>
									Remove
								</SecondaryButton>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
