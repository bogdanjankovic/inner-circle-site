
/**
 * Parses CSV or TSV data into a 2D array of strings.
 * Handles quoted strings (e.g. "1,000") correctly.
 * Auto-detects separator (Tab or Comma) based on the first line.
 */
export function parseTableData(raw: string): string[][] {
    if (!raw || raw.trim() === '') return [];

    const lines = raw.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];

    // Detect separator from first line
    const firstLine = lines[0];
    // Simple heuristic: if it has tabs, assume TSV (Sheets copy paste often uses tabs).
    // If no tabs but commas, assume CSV.
    const separator = firstLine.includes('\t') ? '\t' : ',';

    const result: string[][] = [];

    for (const line of lines) {
        const row: string[] = [];
        let currentCell = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote ("") -> just one quote
                    currentCell += '"';
                    i++; // skip next quote
                } else {
                    // Toggle quote state
                    insideQuotes = !insideQuotes;
                }
            } else if (char === separator && !insideQuotes) {
                // End of cell
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        // Push last cell
        row.push(currentCell.trim());
        result.push(row);
    }

    return result;
}
