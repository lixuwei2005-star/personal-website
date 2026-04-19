interface RestCountry {
	name?: {
		common?: string;
	};
	cca2?: string;
}

interface CountriesNowState {
	name?: string;
	state_code?: string;
}

interface CountriesNowResponse {
	error?: boolean;
	msg?: string;
	data?: {
		name?: string;
		states?: CountriesNowState[];
	};
}

interface NominatimPlace {
	lat?: string;
	lon?: string;
}

export interface FootprintCountryOption {
	code: string;
	name: string;
}

export interface FootprintRegionOption {
	code: string;
	name: string;
}

export interface ResolvedFootprintLocation {
	title: string;
	country: string;
	province: string;
	latitude: number;
	longitude: number;
}

const REST_COUNTRIES_ENDPOINT =
	"https://restcountries.com/v3.1/all?fields=name,cca2";
const COUNTRIES_NOW_STATES_ENDPOINT =
	"https://countriesnow.space/api/v0.1/countries/states";
const NOMINATIM_SEARCH_ENDPOINT =
	"https://nominatim.openstreetmap.org/search";

const REQUEST_HEADERS = {
	"User-Agent": "MizukiFootprints/1.0",
	Accept: "application/json",
};

let countriesCache: FootprintCountryOption[] | null = null;
const regionsCache = new Map<string, FootprintRegionOption[]>();

function slugifyRegionCode(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9-_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normalizeCountryOptions(payload: RestCountry[]): FootprintCountryOption[] {
	return payload
		.map((country) => ({
			code: String(country.cca2 ?? "").trim().toUpperCase(),
			name: String(country.name?.common ?? "").trim(),
		}))
		.filter((country) => /^[A-Z]{2}$/.test(country.code) && country.name)
		.sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init);
	if (!response.ok) {
		throw new Error(`Remote request failed: ${response.status}`);
	}
	return (await response.json()) as T;
}

async function searchNominatim(
	params: Record<string, string>,
): Promise<NominatimPlace | null> {
	const searchParams = new URLSearchParams({
		format: "jsonv2",
		limit: "1",
		...params,
	});
	const url = `${NOMINATIM_SEARCH_ENDPOINT}?${searchParams.toString()}`;
	const results = await fetchJson<NominatimPlace[]>(url, {
		headers: REQUEST_HEADERS,
	});
	return results[0] ?? null;
}

function parseCoordinates(place: NominatimPlace | null) {
	if (!place) {
		return null;
	}

	const latitude = Number.parseFloat(String(place.lat ?? ""));
	const longitude = Number.parseFloat(String(place.lon ?? ""));
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return null;
	}

	return { latitude, longitude };
}

export async function getFootprintCountries(): Promise<FootprintCountryOption[]> {
	if (countriesCache) {
		return countriesCache;
	}

	const payload = await fetchJson<RestCountry[]>(REST_COUNTRIES_ENDPOINT, {
		headers: REQUEST_HEADERS,
	});
	countriesCache = normalizeCountryOptions(payload);
	return countriesCache;
}

export async function getFootprintRegions(
	countryCode: string,
): Promise<FootprintRegionOption[]> {
	const normalizedCode = countryCode.trim().toUpperCase();
	if (!/^[A-Z]{2}$/.test(normalizedCode)) {
		return [];
	}

	if (regionsCache.has(normalizedCode)) {
		return regionsCache.get(normalizedCode)!;
	}

	const countries = await getFootprintCountries();
	const country = countries.find((item) => item.code === normalizedCode);
	if (!country) {
		return [];
	}

	// countriesnow.space 对港澳台、梵蒂冈等"非典型国家"常常返回 error:true 或非 2xx
	// 状态。遇到这种情况不要直接让整个 options API 崩掉，而是 fallback 到用国家名本身
	// 作为唯一可选政区。
	let states: CountriesNowState[] = [];
	try {
		const payload = await fetchJson<CountriesNowResponse>(
			COUNTRIES_NOW_STATES_ENDPOINT,
			{
				method: "POST",
				headers: {
					...REQUEST_HEADERS,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ country: country.name }),
			},
		);
		if (!payload.error && Array.isArray(payload.data?.states)) {
			states = payload.data.states;
		}
	} catch {
		// 远端服务挂了或不认识这个国家，下面的空 states 会触发兜底
	}
	const normalizedRegions = states
		.map((state) => {
			const name = String(state.name ?? "").trim();
			const code =
				String(state.state_code ?? "").trim().toUpperCase() ||
				slugifyRegionCode(name);
			return {
				code,
				name,
			};
		})
		.filter((region) => region.name);

	const regions =
		normalizedRegions.length > 0
			? normalizedRegions
			: [
					{
						code: normalizedCode,
						name: country.name,
					},
				];

	regionsCache.set(normalizedCode, regions);
	return regions;
}

export async function resolveFootprintLocation(
	countryIdentifier: string,
	provinceName: string,
): Promise<ResolvedFootprintLocation> {
	const normalizedCountryIdentifier = countryIdentifier.trim();
	const normalizedProvince = provinceName.trim();
	if (!normalizedCountryIdentifier) {
		throw new Error("Please choose a country");
	}
	if (!normalizedProvince) {
		throw new Error("Please choose an administrative region");
	}

	const countries = await getFootprintCountries();
	const country =
		countries.find(
			(item) => item.code === normalizedCountryIdentifier.toUpperCase(),
		) ??
		countries.find(
			(item) =>
				item.name.toLowerCase() === normalizedCountryIdentifier.toLowerCase(),
		);
	if (!country) {
		throw new Error("Country not found");
	}
	const countryCode = country.code.toLowerCase();

	async function tryLookup(
		params: Record<string, string>,
	): Promise<{ latitude: number; longitude: number } | null> {
		try {
			return parseCoordinates(await searchNominatim(params));
		} catch {
			return null;
		}
	}

	let coordinates =
		(await tryLookup({
			country: country.name,
			state: normalizedProvince,
			countrycodes: countryCode,
		})) ??
		(await tryLookup({
			q: `${normalizedProvince}, ${country.name}`,
			countrycodes: countryCode,
		})) ??
		(await tryLookup({
			q: `${normalizedProvince} ${country.name}`,
			countrycodes: countryCode,
		}));

	// 如果 province == country 或者省份搜索都没命中，退化为直接搜国家中心点,
	// 避免港澳台这种"省=国"的场景整个保存失败。
	if (!coordinates) {
		coordinates =
			(await tryLookup({
				country: country.name,
				countrycodes: countryCode,
			})) ??
			(await tryLookup({
				q: country.name,
			}));
	}

	if (!coordinates) {
		throw new Error("Unable to locate this administrative region");
	}

	return {
		title: normalizedProvince || country.name,
		country: country.name,
		province: normalizedProvince,
		latitude: coordinates.latitude,
		longitude: coordinates.longitude,
	};
}
