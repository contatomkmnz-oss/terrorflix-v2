import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			/** Menos trabalho repetido ao navegar (catálogo muda sobretudo no admin). */
			staleTime: 60 * 1000,
			gcTime: 5 * 60 * 1000,
		},
	},
});