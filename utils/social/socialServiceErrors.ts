import axios from "axios";

/** True when the social service is unreachable (not running, wrong port, CORS/network). */
export function isSocialServiceUnreachable(error: unknown): boolean {
	if (!axios.isAxiosError(error)) return false;
	if (error.response) return false;
	const code = error.code || "";
	return (
		code === "ECONNREFUSED" ||
		code === "ERR_NETWORK" ||
		code === "ECONNABORTED" ||
		/Network Error/i.test(error.message)
	);
}

export const SOCIAL_SERVICE_UNAVAILABLE_MESSAGE =
	"SocialSnipper backend is unavailable. Start totalads-social-service on port 3005, then refresh.";
