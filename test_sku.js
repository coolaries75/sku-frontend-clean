// SKU Generation Test

function generateSKU(column, row, category, lastSerial) {
    // Ensure inputs are valid
    if (!column || !row || !category) {
        throw new Error("Missing required fields.");
    }

    // Generate next serial number (increment last one)
    let nextSerial = lastSerial ? lastSerial + 1 : 1;
    let serialStr = nextSerial.toString().padStart(4, '0'); // Ensure 4-digit format (0001, 0002, etc.)

    // Generate category code (4 characters)
    const categoryCode = category.slice(0, 4).toUpperCase();

    // Generate Date Code (MMYY)
    const date = new Date();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear().toString().slice(-2);
    const dateCode = `${month}${year}`;

    // Construct SKU
    const generatedSKU = `${column}${row}-${serialStr}-${dateCode}-${categoryCode}`;

    return { sku: generatedSKU, serialNumber: nextSerial };
}

// Test Cases
console.log(generateSKU("A", "1", "cat1", 0)); // Should return "A1-0001-MMYY-CAT1"
console.log(generateSKU("B", "2", "cat2", 10)); // Should return "B2-0011-MMYY-CAT2"
console.log(generateSKU("C", "3", "category3", 99)); // Should return "C3-0100-MMYY-CATE"
console.log(generateSKU("D", "4", "categoryX", 250)); // Should return "D4-0251-MMYY-CATE"
