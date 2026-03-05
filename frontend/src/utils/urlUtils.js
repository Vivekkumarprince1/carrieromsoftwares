const rawApiBaseUrl =
	import.meta.env.VITE_API_URL ||
	import.meta.env.VITE_API_BASE_URL ||
	(import.meta.env.DEV ? 'http://localhost:3000' : '');

const API_BASE_URL = (rawApiBaseUrl || '').replace(/\/+$/, '');

const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;

export const normalizeFileUrl = (url) => {
	if (!url || typeof url !== 'string') return '';

	const trimmedUrl = url.trim();
	if (!trimmedUrl) return '';

	if (ABSOLUTE_URL_REGEX.test(trimmedUrl) || trimmedUrl.startsWith('blob:') || trimmedUrl.startsWith('data:')) {
		return trimmedUrl;
	}

	if (!API_BASE_URL) {
		return trimmedUrl;
	}

	return trimmedUrl.startsWith('/')
		? `${API_BASE_URL}${trimmedUrl}`
		: `${API_BASE_URL}/${trimmedUrl}`;
};

export const getResumeViewUrl = (resumeUrl) => {
	const normalizedUrl = normalizeFileUrl(resumeUrl);
	if (!normalizedUrl) return '';

	try {
		const pathname = new URL(normalizedUrl).pathname.toLowerCase();
		const isPdf = pathname.endsWith('.pdf');
		const isWordDocument = pathname.endsWith('.doc') || pathname.endsWith('.docx');

		if (isPdf) {
			return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(normalizedUrl)}`;
		}

		if (isWordDocument) {
			return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(normalizedUrl)}`;
		}
	} catch (_error) {
		return normalizedUrl;
	}

	return normalizedUrl;
};
