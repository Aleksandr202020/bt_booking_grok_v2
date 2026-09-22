import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { f as cn } from "./functions-PbePFcDc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-D51PCq8e.js
var import_jsx_runtime = require_jsx_runtime();
function Badge({ className, tone = "neutral", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
			neutral: "bg-surface-2 text-muted",
			ok: "bg-ok-bg text-ok",
			warn: "bg-warn-bg text-warn",
			danger: "bg-danger-bg text-danger",
			steel: "bg-steel/15 text-steel"
		}[tone], className),
		...props
	});
}
//#endregion
export { Badge as t };
