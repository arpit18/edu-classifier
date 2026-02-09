export type ColumnWidth = { wch: number }

export async function writeExcelFromRows(
	rows: Array<Array<string | number>>,
	sheetName = 'Results',
	filename = 'classification_results.xlsx',
	columnWidths?: ColumnWidth[],
): Promise<void> {
	const XLSX = await import('xlsx')
	const worksheet = XLSX.utils.aoa_to_sheet(rows)
	if (columnWidths && Array.isArray(columnWidths)) {
		;(worksheet as unknown as Record<string, unknown>)['!cols'] = columnWidths
	}
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
	XLSX.writeFile(workbook, filename)
}

