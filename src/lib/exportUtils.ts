/**
 * Converts an array of objects to a CSV string.
 * @param data Array of objects to export
 * @param headers Optional mapping of keys to display headers (e.g. { name: 'Full Name' })
 */
export function convertToCSV(data: any[], headers?: Record<string, string>): string {
    if (!data || !data.length) return '';

    const keys = Object.keys(headers || data[0]);
    const headerRow = keys.map(k => headers ? headers[k] : k).join(',');

    const rows = data.map(item => {
        return keys.map(key => {
            let val = item[key];
            if (val === null || val === undefined) val = '';
            // Escape quotes and wrap in quotes if contains comma
            const stringVal = String(val).replace(/"/g, '""');
            return stringVal.includes(',') ? `"${stringVal}"` : stringVal;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
}

/**
 * Triggers a browser download of a CSV file.
 * @param csv CSV string content
 * @param filename Desired filename (e.g. 'students.csv')
 */
export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
