// src/api/getErrorMessage.js

// الباك بيرجّع الأخطاء بشكلين:
//   validation:  { message: "Validation failed", errors: [{ field, message }, ...] }
//   عادي:        { message: "Invalid email or password" }
// الدالة دي بتطلّع أنسب رسالة تتعرض لليوزر من أي شكل فيهم
export function getErrorMessage(error) {
	const data = error?.response?.data;

	// أول رسالة من أخطاء الـ validation (مثلاً "Password must be at least 8 characters")
	if (data?.errors?.length > 0) return data.errors[0].message;

	if (data?.message) return data.message;

	// مفيش response أصلاً = السيرفر واقف أو النت قاطع
	if (error?.request) return 'Cannot reach the server. Please try again.';

	return 'Something went wrong. Please try again.';
}