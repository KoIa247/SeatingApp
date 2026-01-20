export const formatDate = (dateStr: string) => {
    // Input: "2024-02-13"
    // Output: "February 13th"
    if (!dateStr) return "";

    // Split the date string manually to avoid timezone issues with new Date()
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;

    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Ordinal suffix
    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return `${months[month - 1]} ${getOrdinal(day)}`;
};
