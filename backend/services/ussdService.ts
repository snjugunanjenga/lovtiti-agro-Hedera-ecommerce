type UssdParams = {
	sessionId?: string;
	serviceCode?: string;
	phoneNumber?: string;
	text: string;
};

export async function handleUssd(params: UssdParams): Promise<string> {
	const input = params.text.trim();
	if (!input) {
		return "CON Welcome to Lovitti Agro Mart\n1. Browse listings\n2. My orders\n3. Help\n4. KYC";
	}

	const parts = input.split("*");
	const level = parts.length;

	if (parts[0] === "1") {
		if (level === 1) return "CON Browse\n1. Grains\n2. Vegetables\n3. Fruits";
		return "END Coming soon: category results via SMS link.";
	}

	if (parts[0] === "2") {
		return "END You have no recent orders.";
	}

	if (parts[0] === "3") {
		return "END For help, call 0800-AGRO or visit lovitti.agro/help";
	}

	if (parts[0] === "4") {
		if (level === 1) return "CON KYC\n1. Buyer\n2. Farmer";
		if (level === 2) return "CON Enter Full Name:";
		if (level === 3) return "CON Enter Country:";
		if (level === 4) return "CON Enter Address:";
		if (level === 5) return "CON Enter ID Number:";
		if (level === 6) return "CON Enter Hedera Wallet:";
		return "END KYC submitted. We'll review shortly.";
	}

	return "END Invalid selection.";
}
