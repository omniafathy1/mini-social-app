// src/api/getErrorMessage.js

// Normalize validation, server, and network errors into a displayable message.
export function getErrorMessage(error) {
	const data = error?.response?.data;

	if (data?.errors?.length > 0) return data.errors[0].message;

	if (data?.message) return data.message;

	if (error?.request) return 'Cannot reach the server. Please try again.';

	return 'Something went wrong. Please try again.';
}